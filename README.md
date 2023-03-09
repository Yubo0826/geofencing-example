## Demo

[https://yubo0826.github.io/geofencing-example/](https://yubo0826.github.io/geofencing-example/)

## 地理圍籬

地理圍籬是一種LBS(Location Based Services)的技術，用一個虛擬的柵欄圍出一個虛擬的地理邊界，當目標進入或離開該區域，使用者會接收到通知或警告。以現今Covid-19疫情期間，最常見的應用是，用來監控居家隔離對象是否離開住所。

本範例透過leaflet繪出所需的圍籬，然後上傳Here平台，最後透過Here api取的各個目標是否在圍籬裡面，以及離圍籬多遠的資訊。

## 工具

### **Here Technologies g**eo-fencing API

Here Technologies是一個PaaS，提供許多地圖服務

官方文件: [https://developer.here.com/documentation/geofencing/dev_guide/index.html](https://developer.here.com/documentation/geofencing/dev_guide/index.html)

### Here layers platform

儲存圍籬數據的雲端: [https://enterprise.here.com/](https://enterprise.here.com/#!/login)

### Leaflet.js

一個開源的JavaScript庫，用於構建Web地圖應用

官方文件:
[https://leafletjs.com/reference.html](https://leafletjs.com/reference.html#polygon)

### **Leaflet Draw API**

用來畫圍籬的
[https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html](https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html#options)

### Vue3

開發環境框架

## 操作步驟

1. 劃出圍籬，並為圍籬命名
2. 點擊export，輸出mkt檔
3. 點擊upload，上傳圍籬到Here雲端
4. 依造需求可自定義目標偵測範圍
5. 點擊右側列表，取得目標與圍籬的資訊
