# NotarisID CRL Monitor

## Introduction
NotarisID is a Qualified Trust Service Provider (QTSP) for the issuenace of electronic certificates. QTSP's are required to publish information on revoked certificates. NotarisID has chosen to do so using a Certificate Revocation List (CRL). This CRL is made available on a http addressable location specified in 
the CP/CPS of the QTSP as well as in the properties of issued certificates. QTSP's are required to keep the CRL current and available on the agreed location.

This application monitors the availabilty and whether the CRL was newly generated within the agreed boundaries. 

The application is distributed as a container to enable deployment outside of the primary infrastructure of the QTSP, such as a public cloud platform. This assures that incidents within the primary infrastructure are not obfusecating availability of the CRL. This is particularly important since the application notifies users in case of unexepected situations and is silent when either it doesnt function or everything is in order. 

## Functionality

### Heartbeat
The application is scheduled to run at set intervals, defined by the host cron jobs which are set within the docker image and defined by the `runningCron` setting. If the application is running within the time range set in `heartbeatTimeRange`, then a heartbeat message is sent to all recipients of notification to assure them that monitoring is functional. It is key to set the `heartbeatTimeRange` range to a setting allowing to send a heartbeat just once a day. If the routine for determining if a heartbeat should be send is failing, then the heartbeat is being sent. Since no valid range was determined, the heartbeat will be send every time the application is running. Repetitive heartbeats and/or an unexpected range indicated in the sent message, indicate a problem with the date range parsing and comparison.

### CRL Retrieval
Next, the CRL is retrieved and the location configured in `crlUrl`. If retrieval fails with an HTTP reason or network/domain name resolving reason, this is treated as a potential problem with the availability of the CRL, and recipients are notitied.

### X509 Validation
If content was retrieved from the configured location, the contenet is validated as being a X509 encoded/signed CRL. This is established by looking for the X509 header and footer with charachters in between which are valid in base64 encoded string. 

If the content cannot be valided as an X509 encoded string, this is treated as a potential problem with the availability of the CRL, and recipients are notitied.

### X509 CRL Parsing
If we have reasonable assuraance that the retrieved content is a X509 CRL, then it is piped to an OpenSSL command for displaying it. An error from OpenSSL or following text parsing is caught and considered as a potential problem with the availability or integrity of the CRL, and recipients are notitied.

### Text Parsing
If parsing of the encoded X509 CRL is succesful, the response of OpenSSL is being parsed. Identification of the Last Updated property is crucial, but also the Common Name within the Distinguished Name of the Certificate Authority for which the CRL was issued is retrieved using regular expressions. If the regular expressions do not match, this is considered as a potential problem with the availability or integrity of the CRL, and recipients are notitied.

### Date/time comparison
Finally, the difference betweeen the contents of the Last Updated property of the CRL and the current date/time is evaluated. If this difference in minutes exceeds the acceptable lifetime as configured in `crlAcceptableLifetimeMinutes`, this is considered as a potential problem with the availability or integrity of the CRL, and recipients are notitied.

### Notification
Any of the potential situations described above are kept in a status object. If this indicates that there were one or more anomalies, than the concatenation of anomaly descriptions is sent to every recipient configured in `recipientsPhoneNumbers`.

Notifications are sent over SMS using Twilio as a service provider, over their API. This requires Twilio related setting to be available in the settings. See below for all the settings

## Configuration

The below list is expected within the application. The application will retrieve their values from environment variables with identical names.

| Property | Values and use |
| ----------- | ----------- |
| debug | The values being either true or false this determines of slightly more logging is written to stdout| 
| twilioUrl | The base url of the Twilio service for sending sms message |
| twilioUsername | The username of the Twilio service for sending sms message |
| twilioPassword | The username of the Twilio service for sending sms message |
| twilioPhoneNumber | The outgoing phone number of the Twilio service for sending sms message |
| recipientsPhoneNumbers | Comma separated phone numbers in international format for receiving sms messages |
| crlUrl | The URL of the CRL being monitored |
| opensslPath | The path on the host to the OpenSSL binary |
| crlAcceptableLifetimeMinutes | The number of minutes since the CRL was last updated that may not be exceeded |
| heartbeatTimeRange | The time range within which the heartbeat is being sent to all recipients. It is expected that thi time range is set to the morning. |

The following property is not an application setting, but must be set as well as an environment variable

| Property | Values and use |
| ----------- | ----------- |
| runningCron | Cron indicating with wich interval the check is performed. |

## Testing

Below are the specifications of test cases considered relevant:

| Name | Description | Expected result | 
| ----------- | ----------- | ----------- |
| EXCEEDED | The CRL was updated longer ago than acceptable | An SMS message is sent to all recipients stating the encountered error |
| HTTP404 | CRL URL host available but content not found  | An SMS message is sent to all recipients stating that an HTTP Error 404 was encountered while downloading the CRL. |
| HTTP50X | CRL URL host available but returns server error | An SMS message is sent to all recipients stating that an HTTP Error 50x was encountered while downloading the CRL.| 
| DNSERROR | CRL URL host name not resolvable in DNS | An SMS message is sent to all recipients stating the encountered error |
| NETWORK |  CRL URL host unreachable over network | An SMS message is sent to all recipients stating the encountered error, possibly after a timeout of 60 seconds depending on the problem cause |
| INVALIDCRL-1 | Retrieved encoded X509 CRL is not a valid X509 CRL from the lookks of it | An SMS message is sent to all recipients stating the encountered error |
| INVALIDCRL-2 | Retrieved encoded X509 CRL is not a valid X509 CRL according to OpenSSL | An SMS message is sent to all recipients stating the encountered error |
| PARSING-1 | Decoded X509 CRL does not contain the expected attributes  | An SMS message is sent to all recipients stating the encountered error |
| PARSING-2 | Date from the decoded X509 CRL cannot be parsed as expected   | An SMS message is sent to all recipients stating the encountered error |
| NOTIF-1 | Authentication to Twilio failed  | No heartbeat message within the configured time range |
| NOTIF-2 | Twilio funds depleted  |  No heartbeat message within the configured time range |
| NOTIF-3 | Twilio service unavailable  | Error in the logging and no heartbeat message within the configured time range |