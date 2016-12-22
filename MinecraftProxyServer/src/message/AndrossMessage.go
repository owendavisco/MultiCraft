package message

// Valid actions
const (
	ACTION_START = "START"
	ACTION_MIGRATE = "MIGRATE"
	ACTION_STOP = "STOP"
)

type AndrossMessage struct {
	Action string `json:"action"`
	Content map[string]string `json:"content"`
}
