package app

import (
	"os"
	"net"
	"fmt"
	"encoding/json"
	"../message"
	"../server"
)


const (
	CONN_HOST = "localhost"
	CONN_TYPE = "tcp"
)

const (
	startCompletedMsg = "Proxy Server Started Successfully, Listenening on Port: %s"
	startFailedMsg = "Proxy Server Failed to Start: %s"
	migrateCompletedMsg = "Proxy Server Migrated Successfully"
	migrateFailedMsg = "Proxy Server Migration Failed: %s"
)

func Start(connPort int) {

	l, err := net.Listen(CONN_TYPE, fmt.Sprintf("%s:%d", CONN_HOST, connPort))
	if err != nil {
		fmt.Println(fmt.Sprintf("Error starting server with port %d: %s", connPort, err.Error()))
		os.Exit(1)
	}
	fmt.Println("Listening for Andross with port: ", connPort)

	conn, err := l.Accept()
	if err != nil {
		fmt.Println(fmt.Sprintf("Failed to establish connection: %s", err.Error()))
		os.Exit(1)
	}
	handleAndrossRequests(conn)
}

func handleAndrossRequests(conn net.Conn) {
	var msg message.AndrossMessage
	var response []byte

	for {
		decoder := json.NewDecoder(conn)
		err := decoder.Decode(&msg)

		if err != nil {
			fmt.Println("Could not parse message from Andross: ", msg, err.Error())
		} else {
			switch msg.Action {

			case message.ACTION_START :
				port, err := server.StartProxyServer(msg.Content["host"])
				if err != nil {
					response = buildAndrossResponse(message.RESPONSE_FAILED, fmt.Sprintf(startFailedMsg, err.Error()))
				} else {
					response = buildAndrossResponse(message.RESPONSE_COMPLETED, fmt.Sprintf(startCompletedMsg, port))
				}
				fmt.Println("Writing start response to andross: ", response)
				conn.Write(response)
				break

			case message.ACTION_MIGRATE :
				err := server.MigrateProxyServer(msg.Content["host"])
				if err != nil {
					response = buildAndrossResponse(message.RESPONSE_FAILED, fmt.Sprintf(migrateFailedMsg, err.Error()))
				} else {
					response = buildAndrossResponse(message.RESPONSE_COMPLETED, migrateCompletedMsg)
				}
				fmt.Println("Writing migrate response to andross: ", response)
				conn.Write(response)
				break

			case message.ACTION_STOP:
				break
			}
		}
	}
}

func buildAndrossResponse(resCode string, resMsg string) []byte {
	resStruct := &message.AndrossResponseMessage{
		ResponseCode: resCode,
		ResponseMessage: resMsg,
	}
	response, err := json.Marshal(resStruct)
	if err != nil {
		fmt.Println("Error when performing json marshal")
		return make([]byte, 0)
	}
	return response
}
