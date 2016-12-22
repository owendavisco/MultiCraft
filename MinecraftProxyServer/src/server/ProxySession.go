package server

import (
	"net"
)

type ProxySession struct {
	client *Client
	server *Server
	id int
}

type Server struct {
	conn net.Conn
	dataChan chan []byte
	breakChan chan bool
}

type Client struct {
	conn net.Conn
	dataChan chan []byte
	userPacket []byte
	encryptReqPacket []byte
	breakChan chan bool
}
