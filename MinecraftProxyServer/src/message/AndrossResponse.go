package message

// Response Codes
const (
	RESPONSE_COMPLETED = "COMPLETED"
	RESPONSE_FAILED = "FAILED"
)

type AndrossResponseMessage struct {
	ResponseCode string `json:"responseCode"`
	ResponseMessage string `json:"message"`
}