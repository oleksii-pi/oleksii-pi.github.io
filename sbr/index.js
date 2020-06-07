// https://googlechrome.github.io/samples/web-bluetooth/device-info.html?name=LED
// https://stackoverflow.com/questions/56852203/how-can-i-write-multiple-values-to-a-ble-characteristic-via-javascript
const ServiceUUID = "b2048013-6ea4-4378-a737-9bf0a2fc410d".toLowerCase();
const CommandCharacteristicUUID = 0x0000;
const SensorBufferCharacteristicUUID = 0x0001;
const SpeedBufferCharacteristicUUID = 0x0002;
const PIDPCharacteristicUUID = 0x0003;
const PIDICharacteristicUUID = 0x0004;
const PIDDCharacteristicUUID = 0x0005;
const TAUCharacteristicUUID = 0x0006;
const SetPointCharacteristicUUID = 0x0007;
const BleProcessingTimeCharacteristic = 0x0008;
const BlePolingIntervalMsCharacteristic = 0x0009;
let options = 
{
    filters: [
        { name: "SelfBalancing" }, 
        { services: [ServiceUUID] }
    ]
};

const log = console.log;

let bleDevice;
let commandCharacteristic;
let sensorCharacteristic;
let sensorBufferCharacteristic;
let speedCharacteristic;
let speedBufferCharacteristic;
let pidPCharacteristic;
let pidICharacteristic;
let pidDCharacteristic;
let tauCharacteristic;
let setPointCharacteristic;
let bleProcessingTimeCharacteristic;
let blePolingIntervalMsCharacteristic;

let setPointValue;

const plotter = document.getElementById("plotter").getContext("2d");
const plotterWidth = plotter.canvas.clientWidth;
const plotterHeight = plotter.canvas.clientHeight;
plotter.canvas.width = plotterWidth;
plotter.canvas.height = plotterHeight;
const plotterData = {};

const plotterAdd = (value, color) => {
    plotterData[color] = plotterData[color] || [];
    plotterData[color].push(value);
};

const plotterDraw = (data) => {
    plotter.clearRect(0, 0, plotterWidth, plotterHeight);
    Object.keys(data).forEach(color => {
        plotter.strokeStyle = color;
        plotter.moveTo(plotterWidth, plotterHeight / 2);
        plotter.beginPath();
        const values = data[color];
        const minX = Math.max(plotterWidth - values.length, 0);
        for (var x = plotterWidth; x > minX; x--) {
            const i = values.length + (x - plotterWidth) - 1;
            plotter.lineTo(x, Math.round(values[i]) + plotterHeight / 2);
        }
        plotter.stroke();
    })
};

let sensorValues = [];
function average(nums) {
    return nums.reduce((a, b) => (a + b)) / nums.length;
};

const receivedSensorData = event => {
    // sensorValues.push(sensorValue);
    // if (sensorValues.length > 20) sensorValues.shift();
    // const sensorAvg = average(sensorValues);
    // log("sensor avg20 = " + sensorAvg);  // this can be changed to filtered value
    const bufferSize = event.target.value.byteLength / 4;
    //log("sensorBufferSize=" + bufferSize);
    for (var i = 0; i < bufferSize; i++) {
        const value = event.target.value.getFloat32(i * 4, true);
        //console.log("sensor="+ value);
        plotterAdd(value * 1000, "#ff0000");         // sensor=red
        plotterAdd(setPointValue * 1000, "#A9A9A9");  // setPoint=gray
    }
};

const receivedSpeedData = event => {
    const bufferSize = event.target.value.byteLength / 4;
    //log("speedBufferSize=" + bufferSize);
    for (var i = 0; i < bufferSize; i++) {
        const value = event.target.value.getFloat32(i * 4, true);
        if (i == 0) console.log("speed="+ value);
        plotterAdd(value * 50 + 100, "#0000ff"); // speed=blue
        plotterAdd(100, "#00ff00");          // zero=green
    }
}

setInterval(() => plotterDraw(plotterData), 50);

const receivedBleProcessingTimeData = event => {
    const bleProcessingTime = event.target.value.getUint32(0, true);
    //log("bleProcessingTime=" + bleProcessingTime);
}

const sendCommand = async code => {
    const buffer = new ArrayBuffer(1);
    const bufferView = new Int8Array(buffer);
    bufferView[0] = code;
    await commandCharacteristic.writeValue(buffer);
    log('> Sent ' + code);
};

const connectButtonOnClick = async () => {
    try {
        bleDevice = await navigator.bluetooth.requestDevice(options);
        log('> Name:      ' + bleDevice.name);
        log('> Id:        ' + bleDevice.id);
        const server = await bleDevice.gatt.connect();
        log('> Connected: ' + server.connected);
        const service = await server.getPrimaryService(ServiceUUID);
        log('> Service:   ' + service.uuid); 
        commandCharacteristic = await service.getCharacteristic(CommandCharacteristicUUID);
        sensorBufferCharacteristic = await service.getCharacteristic(SensorBufferCharacteristicUUID);
        speedBufferCharacteristic = await service.getCharacteristic(SpeedBufferCharacteristicUUID);
        pidPCharacteristic = await service.getCharacteristic(PIDPCharacteristicUUID);
        pidICharacteristic = await service.getCharacteristic(PIDICharacteristicUUID);
        pidDCharacteristic = await service.getCharacteristic(PIDDCharacteristicUUID);
        tauCharacteristic = await service.getCharacteristic(TAUCharacteristicUUID);
        setPointCharacteristic = await service.getCharacteristic(SetPointCharacteristicUUID);
        bleProcessingTimeCharacteristic = await service.getCharacteristic(BleProcessingTimeCharacteristic);
        blePolingIntervalMsCharacteristic = await service.getCharacteristic(BlePolingIntervalMsCharacteristic);

        await sensorBufferCharacteristic.addEventListener('characteristicvaluechanged', receivedSensorData);
        await sensorBufferCharacteristic.startNotifications();
        await speedBufferCharacteristic.addEventListener('characteristicvaluechanged', receivedSpeedData);
        await speedBufferCharacteristic.startNotifications();

        await bleProcessingTimeCharacteristic.addEventListener('characteristicvaluechanged', receivedBleProcessingTimeData);
        await bleProcessingTimeCharacteristic.startNotifications();

        await sendCommand(66); // send command 'b' = start sending sensor data and speed
    } catch (e) { log(e); }
};

const sendPID = async () => {
    const buffer = new ArrayBuffer(8);
    const bufferView = new DataView(buffer);

    const P = +document.getElementById("PID_P").value;
    bufferView.setFloat64(0, P, true);
    await pidPCharacteristic.writeValue(buffer);
    log("set PID_P=" + P);

    const I = +document.getElementById("PID_I").value;
    bufferView.setFloat64(0, I, true);
    await pidICharacteristic.writeValue(buffer);
    log("set PID_I=" + I);

    const D = +document.getElementById("PID_D").value;
    bufferView.setFloat64(0, D, true);
    await pidDCharacteristic.writeValue(buffer);
    log("set PID_D=" + D);
}

const sendValue = async e => {
    const elementId = e.target.id;

    if (e.keyCode === 13) {
        const valueFromElement = +document.getElementById(elementId).value;
        const buffer = new ArrayBuffer(8);
        const bufferView = new DataView(buffer);
        bufferView.setFloat64(0, valueFromElement, true);
        
        if (elementId == "PID_P") {
            await pidPCharacteristic.writeValue(buffer);
        }

        if (elementId == "PID_I") {
            await pidICharacteristic.writeValue(buffer);
        }

        if (elementId == "PID_D") {
            await pidDCharacteristic.writeValue(buffer);
        }

        if (elementId == "TAU") {
            await tauCharacteristic.writeValue(buffer);
        }

        if (elementId == "setPoint") {
            setPointValue = valueFromElement;
            await setPointCharacteristic.writeValue(buffer);
        }

        if (elementId == "blePolingInterval") {
            bufferView.setUint32(0, valueFromElement, true);
            await blePolingIntervalMsCharacteristic.writeValue(buffer);
        }

        if (elementId == "moveSteps") {
            await sendCommand(valueFromElement);
        }
        
        log("set " + elementId + '=' + valueFromElement);
        return;
    }

    let delta = 0;
    if (e.keyCode === 38) delta = 1.1;
    if (e.keyCode === 40) delta = -1.1;
    if (delta === 0) return;
    
    const oldValue = document.getElementById(elementId).value;
    const ss = oldValue.split('.');
    const multiplier = ss.length > 1 ? Math.pow(10, ss[1].length) : 1;
    const newValue = 1.0 * (+oldValue * multiplier + delta * Math.sign(+oldValue)) / multiplier;
    document.getElementById(elementId).value = ('' + newValue).substr(0, oldValue.length);
};

// const disconnectButtonOnClick = () => {
//     bleDevice.gatt.disconnect();
//     log('> Disconnected.');
// };

const drawLines = function(event) {
    const element = event.currentTarget;
    const x = event.layerX;
    const y = event.layerY;
    
    let vLine = element.querySelector('.verticalLine');
    let hLine = element.querySelector('.horizontalLine');
    
    const vTrans = 'translate(' + x + 'px, 0px)';
    const hTrans = 'translate(0px, ' + y + 'px)';
    if(!vLine) {
       vLine = document.createElement('div');
       vLine.classList.add('verticalLine');
       vLine.style.height = "100%";
       vLine.style.width = '1px';
       element.appendChild(vLine);
    }
    vLine.style.transform = vTrans;
    
    if(!hLine) {
       hLine = document.createElement('div');
       hLine.style.height = "1px";
       hLine.classList.add('horizontalLine');
       hLine.style.width = '100%';
       element.appendChild(hLine);
    }
    hLine.style.transform = hTrans;
}

document
    .getElementById("connectButton")
    .addEventListener("click", connectButtonOnClick);

document
    .getElementById("applyPIDButton")
    .addEventListener("click", () => sendPID());    

document
    .getElementById("PID_P")
    .addEventListener("keydown", e => sendValue(e)); 

document
    .getElementById("PID_I")
    .addEventListener("keydown", e => sendValue(e)); 

document
    .getElementById("PID_D")
    .addEventListener("keydown", e => sendValue(e)); 

document
    .getElementById("TAU")
    .addEventListener("keydown", e => sendValue(e));
    
document
    .getElementById("setPoint")
    .addEventListener("keydown", e => sendValue(e));    

document
    .getElementById("blePolingInterval")
    .addEventListener("keydown", e => sendValue(e));    

document
    .getElementById("moveSteps")
    .addEventListener("keydown", e => sendValue(e));

document
    .getElementById("plotterEnable")
    .addEventListener("click", () => sendCommand(66)); 

document
    .getElementById("plotterOverlay")
    .addEventListener('mousemove', drawLines);   
    
document
    .body
    .addEventListener("keydown", e => sendCommand(e.keyCode));     

