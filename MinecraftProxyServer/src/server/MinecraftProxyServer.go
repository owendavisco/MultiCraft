package server

import (
	"net"
	"fmt"
	"sync"
	"encoding/binary"
	"../client"
)

// TODO: States should be used with mutex
const (
	RUNNING = iota
	STARTING
	MIGRATING
	STOPPING
	IDLE
)

const (
	CONN_HOST = "localhost"
	CONN_TYPE = "tcp"
	CONN_PORT = "8080"
)

var state = IDLE
var connections = make(map[int]*ProxySession)
var minecraftServerAddress = "locahost:25565"
var minecraftRconAddress = "localhost:25575"
var rconClient *client.MinecraftRconClient

func StartProxyServer(serverHostname string, serverPort string, rconPort string) (string, error) {
	state = STARTING
	fmt.Println("Proxy Server Starting")
	minecraftServerAddress = fmt.Sprintf("%s:%s", serverHostname, serverPort)
	minecraftRconAddress = fmt.Sprintf("%s:%s", serverHostname, rconPort)

	serverRcon, err := client.NewRconClient(minecraftRconAddress)
	if err != nil {
		fmt.Println("Error with connection to minecraft server rcon: ", err.Error())
		return "", err
	}
	rconClient = serverRcon

	ln, err := net.Listen(CONN_TYPE, fmt.Sprintf("%s:%s", CONN_HOST, CONN_PORT))
	if err != nil {
		return "", err
	}
	go handleNewClients(ln)
	return CONN_PORT, nil
}

func handleNewClients(ln net.Listener) error {
	state = RUNNING
	fmt.Println("Proxy Server Start Completed")

	sessionId := 0

	for state != STOPPING {
		if state == RUNNING {
			clientConn, err := ln.Accept()
			if err != nil {
				fmt.Println("Error with connection to client: ", err.Error())
				continue
			}

			loginPackets, err := readLoginPackets(clientConn)
			if err != nil {
				fmt.Println("Error parsing client login packets: ", err.Error())
				continue
			}

			fmt.Println("Client Login Read: ", loginPackets[0])
			fmt.Println("Client Login Read: ", loginPackets[1])

			serverConn, err := net.Dial(CONN_TYPE, minecraftServerAddress)
			if err != nil {
				fmt.Println("Error with connection to minecraft server: ", err.Error())
				return err
			}

			serverConn.Write(loginPackets[0])
			serverConn.Write(loginPackets[1])

			clientChan := createBufferedConnChan(clientConn, 512, 64)
			serverChan := createBufferedConnChan(serverConn, 1048576, 0)

			currentSession := &ProxySession{
				client: &Client{
					conn: clientConn,
					userPacket: loginPackets[0],
					encryptReqPacket: loginPackets[1],
					dataChan: clientChan,
					breakChan: make(chan bool),
				},
				server: &Server{
					conn: serverConn,
					dataChan: serverChan,
					breakChan: make(chan bool),
				},
				id: sessionId,
			}
			connections[sessionId] = currentSession
			go createPipeline(currentSession)

			sessionId++
		}
	}
	return nil
}

// TODO: Improve upon logic
func readLoginPackets(conn net.Conn) ([][]byte, error) {
	loginPackets := make([][]byte, 2)
	packetCount := 0
	buf := make([]byte, 256)
	for packetCount < 2 {
		n, err := conn.Read(buf)
		if err != nil {
			fmt.Println("Error waiting for login requests")
			return nil, err
		}

		currentPacket := make([]byte, n)
		copy(currentPacket, buf[:n])
		packetSize, _ := binary.Uvarint(currentPacket)
		loginPackets[packetCount] = currentPacket[:packetSize + 1]
		packetCount++

		for len(currentPacket) > int(packetSize + 1) && packetCount < 2 {
			currentPacket := currentPacket[packetSize:]
			packetSize, _ = binary.Uvarint(currentPacket)
			loginPackets[packetCount] = currentPacket[:packetSize + 1]
			packetCount++
		}
	}

	return loginPackets, nil
}

func createPipeline(session *ProxySession) {
	fmt.Println("Proxy Server Creating Connection Pipeline")

	go func() {
		fmt.Println("Creating client -> server connection")
		serverConn := session.server.conn
		clientChan := session.client.dataChan
		clientBreakChan := session.client.breakChan
		//serverBreakChan := session.server.breakChan
		for {
			select {
			case <-clientBreakChan:
				fmt.Println("Closing client -> server connection")
				return
			case clientData := <-clientChan:
				if clientData == nil {
					fmt.Println("Connection with client broken, closing pipeline")
					//serverBreakChan <- true
					return
				} else {
					serverConn.Write(clientData)
				}
			}
		}
	}()

	go func() {
		fmt.Println("Creating server -> client connection")
		clientConn := session.client.conn
		serverChan := session.server.dataChan
		//clientBreakChan := session.client.breakChan
		serverBreakChan := session.server.breakChan
		for {
			select {
			case <-serverBreakChan:
				fmt.Println("Closing server -> client connection")
				return
			case serverData := <-serverChan:
				if serverData == nil {
					fmt.Println("Connection with server broken, closing pipeline")
					//clientBreakChan <- true
					return
				} else {
					//num, _ := binary.Uvarint(serverData)
					//fmt.Println("Writing data to client (", len(serverData), ")(", num + 1, "): ", serverData)
					clientConn.Write(serverData)
				}
			}
		}
	}()

	fmt.Println("Proxy Server Creating Connection Pipeline Completed")
}

func createBufferedConnChan(conn net.Conn, packetBufSize int, chanBufSize int) chan []byte {
	connChan := make(chan []byte, chanBufSize)

	go func() {
		buf := make([]byte, packetBufSize)

		for {
			n, err := conn.Read(buf)
			if n > 0 {
				res := make([]byte, n)
				copy(res, buf[:n])
				connChan <- res
			}
			if err != nil {
				fmt.Println("Error reading buffer: ", err.Error(), ", Closing...")
				break
			}
		}
	}()

	return connChan
}

func MigrateProxyServer(newServerHostname string, newServerPort string, newRconPort string) error {
	fmt.Println("Proxy Server Migrating Users")
	minecraftServerAddress = fmt.Sprintf("%s:%s", newServerHostname, newServerPort)
	minecraftRconAddress = fmt.Sprintf("%s:%s", newServerHostname, newRconPort)
	var wg sync.WaitGroup

	state = MIGRATING
	for _, session := range connections {
		wg.Add(1)
		go migrateSession(session, &wg)
	}

	wg.Wait()
	fmt.Println("Proxy Server Migration Completed")
	state = RUNNING

	return nil
}

//TODO: implement minecraft ssl handshake
func waitForLoginCompletion(conn net.Conn) {
	packetCount := 0
	buf := make([]byte, 2048)
	for packetCount < 10 {
		n, err := conn.Read(buf)
		if err != nil {
			fmt.Println("Error waiting for login requests")
		}

		currentPacket := make([]byte, n)
		copy(currentPacket, buf[:n])
		packetSize, _ := binary.Uvarint(currentPacket)
		packetCount++

		for len(currentPacket) > int(packetSize + 1) {
			currentPacket := currentPacket[packetSize:]
			packetSize, _ = binary.Uvarint(currentPacket)
			packetCount++
		}
	}
}

func migrateSession(session *ProxySession, wg *sync.WaitGroup) error {
	fmt.Println("Logging user into new server")
	// Log users into new server
	client := session.client
	newServerConn, err := net.Dial(CONN_TYPE, minecraftServerAddress)
	if err != nil {
		fmt.Println("Error with connection to new minecraft server", err.Error())
		return err
	}
	newServerConn.Write(client.userPacket)
	newServerConn.Write(client.encryptReqPacket)
	waitForLoginCompletion(newServerConn)
	fmt.Println("User logged into new server")

	// Clean up connections with old server and set the new server
	server := session.server

	oldChan := server.dataChan
	oldConn := server.conn

	server.breakChan <- true
	client.breakChan <- true

	server.dataChan = createBufferedConnChan(newServerConn, 1048576, 0)
	server.conn = newServerConn

	oldConn.Close()
	close(oldChan)

	// Create new pipeline
	createPipeline(session)

	wg.Done()
	return nil
}

func GetServerState() int {
	return state
}