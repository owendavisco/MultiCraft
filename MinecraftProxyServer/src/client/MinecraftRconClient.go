package client

import (
	"net"
	"bytes"
	"encoding/binary"
	//"errors"
	"fmt"
	"errors"
)

const (
	AUTH_TYPE int32 = 3
	COMMAND_TYPE int32 = 2
	AUTH_RES_TYPE int32 = 2
)

const (
	SAVE_ALL = "save-all"
)

const tempPassword = "tempPassword"

var currentId int32 = 0

type MinecraftRconClient struct {
	MinecraftRconAddress string
	RconConn net.Conn
}

func NewRconClient(rconAddress string) (*MinecraftRconClient, error) {
	var client MinecraftRconClient
	client.MinecraftRconAddress = rconAddress
	rconConn, err := net.Dial("tcp", rconAddress)
	if err != nil {
		return nil, err
	}

	fmt.Println("Logging into minecraft server rcon")

	client.RconConn = rconConn
	if client.authenticate() != nil {
		return nil, err
	}

	return &client, nil
}

func (client MinecraftRconClient) authenticate() error {
	client.RconConn.Write(createRconPacket(AUTH_TYPE, tempPassword))

	resp, err := client.parseResponse()
	if err != nil {
		fmt.Println("Error parsing rcon response: ", err.Error())
		return err
	}
	if resp.ReqType != AUTH_RES_TYPE {
		return errors.New("Not Authorized to use RCON")
	}

	return nil
}

func (client MinecraftRconClient) SaveWorldData() {
	fmt.Println("Saving world data")
	client.RconConn.Write(createRconPacket(COMMAND_TYPE, SAVE_ALL))
}

func createRconPacket(reqType int32, reqMessage string) []byte {
	buf := new(bytes.Buffer)
	reqId := currentId
	currentId++

	binary.Write(buf, binary.LittleEndian, 10 + len(reqMessage))
	binary.Write(buf, binary.LittleEndian, reqId)
	binary.Write(buf, binary.LittleEndian, reqType)
	binary.Write(buf, binary.LittleEndian, []byte(reqMessage))
	binary.Write(buf, binary.LittleEndian, int16(0))

	return buf.Bytes()
}

func (client MinecraftRconClient) parseResponse() (*MinecraftRconResponse, error) {
	buf := make([]byte, 4096)
	size, err := client.RconConn.Read(buf)
	if err != nil {
		fmt.Println("Error reading rcon server response: ", err.Error())
		return nil, err
	}

	var rconResponse MinecraftRconResponse
	temp := make([]byte, size - 12)

	byteBuf := bytes.NewBuffer(buf)
	binary.Read(byteBuf, binary.LittleEndian, &(rconResponse.Size))
	binary.Read(byteBuf, binary.LittleEndian, &(rconResponse.ReqId))
	binary.Read(byteBuf, binary.LittleEndian, &(rconResponse.ReqType))
	binary.Read(byteBuf, binary.LittleEndian, &(temp))
	rconResponse.ReqMessage = string(temp[:size - 12])

	return &rconResponse, nil
}