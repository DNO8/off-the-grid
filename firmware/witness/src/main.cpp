#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

#include "checkpoint_packet.h"

namespace {
constexpr size_t kPacketBytes = 184;
constexpr uint16_t kAttMtu = 247;
constexpr uint16_t kMinimumAttMtu = kPacketBytes + 3;
constexpr char kServiceUuid[] = "a9643da4-4e14-44bc-83e5-3d4100c27943";
constexpr char kPacketUuid[] = "a9643da5-4e14-44bc-83e5-3d4100c27943";

BLECharacteristic* packetCharacteristic = nullptr;
BLEServer* witnessServer = nullptr;
bool connected = false;
bool subscribed = false;
bool sent = false;

class PacketCallbacks final : public BLECharacteristicCallbacks {
  void onSubscribe(BLECharacteristic*, ble_gap_conn_desc*, uint16_t value) override {
    subscribed = (value & 1) != 0;
  }
};

class ServerCallbacks final : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    connected = true;
    subscribed = false;
    sent = false;
  }

  void onDisconnect(BLEServer*) override {
    connected = false;
    subscribed = false;
    BLEDevice::startAdvertising();
  }
};
}  // namespace

void setup() {
  static_assert(sizeof(kCheckpointPacket) == kPacketBytes, "packet must be 184 bytes");
  Serial.begin(115200);
  BLEDevice::init("SOZU Witness");
  BLEDevice::setMTU(kAttMtu);

  witnessServer = BLEDevice::createServer();
  witnessServer->setCallbacks(new ServerCallbacks());
  BLEService* service = witnessServer->createService(kServiceUuid);
  packetCharacteristic = service->createCharacteristic(
      kPacketUuid, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  packetCharacteristic->setCallbacks(new PacketCallbacks());
  packetCharacteristic->setValue(kCheckpointPacket, kPacketBytes);
  service->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(kServiceUuid);
  advertising->start();
  Serial.println("SOZU witness ready: BLE packet is 184 bytes");
}

void loop() {
  if (connected && !sent) {
    // A 184-byte notification requires at least 187-byte ATT MTU at both ends.
    if (subscribed &&
        witnessServer->getPeerMTU(witnessServer->getConnId()) >= kMinimumAttMtu) {
      packetCharacteristic->notify();
      sent = true;
      Serial.println("SOZU2 checkpoint notified once");
    }
  }
  delay(20);
}
