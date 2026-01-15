// utils/bluetoothPrinter.ts

const PRINTER_SERVICES = [
    "000018f0-0000-1000-8000-00805f9b34fb", // Printer Service
    "00001101-0000-1000-8000-00805f9b34fb"  // Serial Port Profile (SPP)
];
const PRINTER_CHARACTERISTIC = "00002af1-0000-1000-8000-00805f9b34fb";

export class BluetoothPrinter {
    // FIX: Use 'any' for Web Bluetooth API types (BluetoothDevice, BluetoothRemoteGATTCharacteristic) as they are not available in the current TypeScript environment.
    private device: any | null = null;
    private characteristic: any | null = null;
    public deviceName: string | null = null;

    async connect(): Promise<'connected' | 'cancelled' | 'failed'> {
        try {
            // FIX: Cast navigator to 'any' to access the 'bluetooth' property, as its type definition is missing.
            this.device = await (navigator as any).bluetooth.requestDevice({
                filters: [{ services: PRINTER_SERVICES }],
                acceptAllDevices: false,
            });

            this.deviceName = this.device.name;

            if (!this.device.gatt) {
                throw new Error("GATT Server not available on this device.");
            }

            const server = await this.device.gatt.connect();
            const service = await server.getPrimaryService(PRINTER_SERVICES[0]).catch(() => server.getPrimaryService(PRINTER_SERVICES[1]));

            if (!service) {
                throw new Error("Could not find a compatible printer service.");
            }
            
            this.characteristic = await service.getCharacteristic(PRINTER_CHARACTERISTIC);

            this.device.addEventListener('gattserverdisconnected', this.onDisconnected);

            return 'connected';
        } catch (error: any) {
            // Don't treat user cancellation as a critical error.
            if (error.name === 'NotFoundError') {
                console.log("Bluetooth device selection cancelled by user.");
                this.disconnect();
                return 'cancelled';
            }
            
            console.error("Bluetooth connection failed:", error);
            this.disconnect(); // Clean up on failure
            return 'failed';
        }
    }

    onDisconnected = () => {
        console.log('Bluetooth device disconnected.');
        this.device = null;
        this.characteristic = null;
        this.deviceName = null;
    }

    async disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        // The 'gattserverdisconnected' event will handle the cleanup.
    }

    isConnected(): boolean {
        return !!this.device && !!this.characteristic && this.device.gatt?.connected === true;
    }

    async print(data: Uint8Array): Promise<void> {
        if (!this.isConnected() || !this.characteristic) {
            throw new Error("Printer not connected.");
        }

        const MTU = this.characteristic.service.device.gatt.mtu || 20;
        const maxChunkSize = MTU - 3;
        
        for (let i = 0; i < data.length; i += maxChunkSize) {
            const chunk = data.slice(i, i + maxChunkSize);
            await this.characteristic.writeValueWithoutResponse(chunk);
        }
    }
}

// Export a single, shared instance for the entire application
export const bluetoothPrinter = new BluetoothPrinter();