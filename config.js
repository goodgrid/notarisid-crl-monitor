
const config = {
    debug: process.env.debug,
    twilioUrl: process.env.twilioUrl,
    twilioUsername: process.env.twilioUsername,
    twilioPassword: process.env.twilioPassword,
    twilioPhoneNumber: process.env.twilioPhoneNumber,
    recipientsPhoneNumbers: process.env.recipientsPhoneNumbers,
    crlUrl: process.env.crlUrl,
    opensslPath: process.env.opensslPath,
    crlAcceptableLifetimeMinutes: process.env.crlAcceptableLifetimeMinutes,
    heartbeatTimeRange: process.env.heartbeatTimeRange 
}

export default config