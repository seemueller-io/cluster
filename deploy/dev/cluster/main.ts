import {Construct} from "constructs";
import {App, TerraformStack} from "cdktf";
import {DockerProvider} from "./.gen/providers/docker/provider";
import {Container} from "./.gen/providers/docker/container";
import {Image} from "./.gen/providers/docker/image";
import {KubernetesProvider} from "./.gen/providers/kubernetes/provider";
import {ConfigMapV1} from "./.gen/providers/kubernetes/config-map-v1";
import {NullProvider} from "./.gen/providers/null/provider";
import {Resource} from "./.gen/providers/null/resource";

export class DockerRegistryStack extends TerraformStack {
    public readonly registryContainer: Container;
    public readonly regName: string = "kind-registry";
    public readonly regPort: string = "5001";

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // Configure providers
        new DockerProvider(this, "docker", {});

        // 1. Create registry container (equivalent to the first part of create-cluster.sh)
        // Pull the registry image
        const registryImage = new Image(this, "registry-image", {
            name: "registry:2",
            keepLocally: true,
        });

        // Create the registry container
        this.registryContainer = new Container(this, "kind-registry", {
            name: this.regName,
            image: registryImage.imageId,
            ports: [{
                internal: 5000,
                external: parseInt(this.regPort),
                ip: "127.0.0.1",
            }],
            restart: "always",
            networksAdvanced: [{
                name: "bridge",
            }],
        });
    }
}


const kindClusterConfig = `kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry]
    config_path = "/etc/containerd/certs.d"
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080
    hostPort: 80
    protocol: TCP
  - containerPort: 30443
    hostPort: 443
    protocol: TCP
`


export class KindClusterStack extends TerraformStack {
    public readonly networkConnection: Resource;
    public readonly kindCluster: Resource;
    public readonly registryConfig: Resource;

    constructor(scope: Construct, id: string, registryStack: DockerRegistryStack) {
        super(scope, id);

        // Add dependency on the registry stack
        this.addDependency(registryStack);

        // Configure providers
        new NullProvider(this, "null", {});

        // 2. Create Kind cluster with configuration
        // This uses a null resource to execute the kind create cluster command
        this.kindCluster = new Resource(this, "kind-cluster", {
            triggers: {
                config: kindClusterConfig
            },
            provisioners: [
                {
                    type: "local-exec",
                    command: `echo '${kindClusterConfig}' | kind create cluster --config=-`,
                    when: 'create'
                },
                {
                    type: "local-exec",
                    command: `kind delete cluster -n kind`,
                    when: 'destroy'
                }
            ],
        });

        // 3. Configure registry for cluster nodes
        this.registryConfig = new Resource(this, "registry-config", {
            provisioners: [
                {
                    type: "local-exec",
                    command: `
            REGISTRY_DIR="/etc/containerd/certs.d/localhost:${registryStack.regPort}"
            for node in $(kind get nodes); do
              docker exec "$node" mkdir -p "$REGISTRY_DIR"
              echo '[host."http://${registryStack.regName}:5000"]' | docker exec -i "$node" cp /dev/stdin "$REGISTRY_DIR/hosts.toml"
            done
          `,
                },
            ],
            dependsOn: [this.kindCluster],
        });

        // 4. Connect registry to cluster network
        this.networkConnection = new Resource(this, "network-connection", {
            provisioners: [
                {
                    type: "local-exec",
                    command: `
            if [ "$(docker inspect -f='{{json .NetworkSettings.Networks.kind}}' "${registryStack.regName}")" = 'null' ]; then
              docker network connect "kind" "${registryStack.regName}"
            fi
          `,
                },
            ],
            dependsOn: [this.registryConfig],
        });
    }
}


export class ClusterConfigStack extends TerraformStack {
    constructor(scope: Construct, id: string, registryStack: DockerRegistryStack, kindClusterStack: KindClusterStack) {
        super(scope, id);

        // Add dependency on the kind cluster stack
        this.addDependency(kindClusterStack);

        // Configure Kubernetes provider after cluster is created
        new KubernetesProvider(this, "kubernetes", {
            configPath: "~/.kube/config",
            configContext: "kind-kind",
        });

        // Create Kubernetes ConfigMap to document the local registry
        new ConfigMapV1(this, "local-registry-hosting", {
            metadata: {
                name: "local-registry-hosting",
                namespace: "kube-public",
            },
            data: {
                "localRegistryHosting.v1": `host: "localhost:${registryStack.regPort}"
help: "https://kind.sigs.k8s.io/docs/user/local-registry/"`,
            },
        });
    }
}

const app = new App();
const registryStack = new DockerRegistryStack(app, "docker-registry");
const kindClusterStack = new KindClusterStack(app, "kind-cluster", registryStack);

new ClusterConfigStack(app, "cluster-config", registryStack, kindClusterStack);
app.synth();
