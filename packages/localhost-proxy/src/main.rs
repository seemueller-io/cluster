use axum::{
    body::Body,
    extract::Request,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::any,
    Router,
};
use reqwest::Client;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{error, info, instrument};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Hardcoded proxy target URL - change this to your desired target
const PROXY_TARGET: &str = "https://machine.127.0.0.1.sslip.io";

#[derive(Clone)]
struct AppState {
    client: Client,
    target_url: String,
}

#[derive(Debug, thiserror::Error)]
enum ProxyError {
    #[error("Request error: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("Invalid header value: {0}")]
    InvalidHeaderValue(#[from] http::header::InvalidHeaderValue),
    #[error("Invalid header name: {0}")]
    InvalidHeaderName(#[from] http::header::InvalidHeaderName),
    #[error("URI parse error: {0}")]
    UriError(#[from] http::uri::InvalidUri),
    #[error("HTTP error: {0}")]
    HttpError(#[from] http::Error),
    #[error("Axum error: {0}")]
    AxumError(String),
    #[error("Method conversion error")]
    MethodError,
}

impl IntoResponse for ProxyError {
    fn into_response(self) -> Response {
        let status = StatusCode::BAD_GATEWAY;
        let body = format!("Proxy error: {}", self);
        error!("Proxy error: {}", self);
        (status, body).into_response()
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "simple_proxy=debug,tower_http=debug,axum::rejection=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Create HTTP client
    let client = Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .danger_accept_invalid_certs(true) // Accept self-signed certificates
        .build()?;

    let state = AppState {
        client,
        target_url: PROXY_TARGET.to_string(),
    };

    // Create router
    let app = Router::new()
        .route("/*path", any(proxy_handler))
        .route("/", any(proxy_handler))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3030").await?;
    
    info!("Simple proxy server starting on http://127.0.0.1:3030");
    info!("Proxying requests to: {}", PROXY_TARGET);
    
    axum::serve(listener, app).await?;

    Ok(())
}

#[instrument(skip(state, request))]
async fn proxy_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    request: Request,
) -> Result<Response, ProxyError> {

    let method = request.method().clone();
    let uri = request.uri().clone();
    let headers = request.headers().clone();
    let body = axum::body::to_bytes(request.into_body(), usize::MAX).await
        .map_err(|e| ProxyError::AxumError(e.to_string()))?;

    // Build target URL
    let path_and_query = uri.path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");
    
    let target_url = format!("{}{}", state.target_url, path_and_query);
    
    info!("Proxying {} {} to {}", method, uri, target_url);

    // Create reqwest request - convert Method types between different http crate versions
    let reqwest_method = reqwest::Method::from_bytes(method.as_str().as_bytes())
        .map_err(|_| ProxyError::MethodError)?;
    let mut req_builder = state.client.request(reqwest_method, &target_url);

    // Add headers (filter out problematic ones)
    for (name, value) in headers.iter() {
        let name_str = name.as_str();
        // Skip hop-by-hop headers and host header
        if !should_skip_header(name_str) {
            req_builder = req_builder.header(name.as_str(), value.as_bytes());
        }
    }

    // Add body if present
    if !body.is_empty() {
        req_builder = req_builder.body(body.to_vec());
    }

    // Execute request
    let response = req_builder.send().await?;

    // Build response
    let status = response.status();
    let response_headers = response.headers().clone();
    let response_body = response.bytes().await?;

    let mut builder = Response::builder().status(status.as_u16());

    // Add response headers (filter out problematic ones)
    for (name, value) in response_headers.iter() {
        if !should_skip_response_header(name.as_str()) {
            builder = builder.header(name.as_str(), value.as_bytes());
        }
    }

    let response = builder
        .body(Body::from(response_body))?;

    Ok(response)
}

fn should_skip_header(name: &str) -> bool {
    matches!(
        name.to_lowercase().as_str(),
        "connection" | "host" | "transfer-encoding" | "upgrade" | "proxy-connection"
    )
}

fn should_skip_response_header(name: &str) -> bool {
    matches!(
        name.to_lowercase().as_str(),
        "connection" | "transfer-encoding" | "upgrade" | "proxy-connection"
    )
}