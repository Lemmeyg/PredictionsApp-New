{
    type: 'service_account',  // Make sure this is correct
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID!,
    token_uri: process.env.GOOGLE_TOKEN_URI!,
    project_id: process.env.GOOGLE_PROJECT_ID!,  // Add this if needed
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL!,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL!
} 