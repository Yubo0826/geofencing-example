<template>
  <div>
    <div>
      <div>
        <button @click="exportMktFileWindow = true">export</button>
        <button @click="uploadFileWindow = true">upload</button>
        <span v-if="RunLoading" style="margin-right: 15px;">
          上傳中
          <img src="@/assets/loading-gif.gif" style="width: 25px;">
        </span>
        <label for="tentacles">偵測範圍(公尺):</label>
        <input v-model="targetDeviceRadius" @change="renderGeofence(), getGeometries()" type="number" id="tentacles" name="tentacles">
      </div>
      <div class="remoCloud-eagle-bottom">
        <div id="map"></div>
        <div class="remoCloud-eagle-deviceList">
          <div
            v-for="dev,index in deviceList" 
            :key="index"
            style="border-bottom: 1px solid #e4e8f0;"
          >
            <!-- Default information -->
            <div class="remoCloud-eagle-deviceItem" @click="clickDeviceItem(index, dev.latlng)">
              <div class="remoCloud-eagle-deviceInfo">
                <div class="remoCloud-eagle-userDefined">
                  目標物 {{ index + 1 }}
                </div>
                <div class="remoCloud-eagle-deviceName">經緯度: {{ dev.latlng[0] }}, {{ dev.latlng[1] }}</div>
                <!-- <div class="remoCloud-eagle-deviceName">{{ dev.modelName }}</div> -->
                <!-- {{ dev.modelName }}, {{ dev.latlng[0] }}, {{ dev.latlng[1] }} -->
              </div>
            </div>

            <!-- Popup geofence information -->  
            <div v-if="showGeofenceInfoArray[index]" class="popup-deviceGeofenceInfo">
              <div v-if="msgLoading" class="remoCloud-geometries-loading">
                <img src="@/assets/loading-gif.gif" style="width: 25px;">
              </div>
              <div v-else>
                
                <div v-for="geofence in geofenceList" :key="geofence">

                </div>
                <div v-for="geometry in geometries" :key="geometry.attributes.NAME">
                  <span v-if="geometry.distance >= 0">
                    距離 {{ geometry.attributes.NAME }} {{ geometry.distance }}公尺
                  </span>
                  <span v-else>
                    在 {{ geometry.attributes.NAME }}裡面
                  </span>
                </div>
                <div v-for="geo in noDetectGeofences" :key="geo">
                  沒有偵測到 {{ geo }}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- add new geofence popup window -->
    <transition>        
      <div v-if="inputGeofenceNameWindow" class="remoCloud-popupWindow-background remoCloud-popupWindow-background-profileName">
        <div class="remoCloud-popupWindow remoCloud-input-popupWindow">
          <h5>Please input geofence name</h5>
          <div class="remoCloud-popupWindow-profileName">
            <input 
              v-model="newGeofenceName"
              class="remoCloud-input" 
              ref="geofenceNameInput"
              type="input" 
              placeholder="Input Geofence Name"
              @keyup.enter="createNewGeofence(), $refs.geofenceNameInput.blur()"
            >
          </div>
          <div class="remoCloud-profileName-bottom">
            <button class="remoCloud-button-implement" @click="createNewGeofence">Submit</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- export geofence mkt file popup window -->
    <transition>        
      <div v-if="exportMktFileWindow" class="remoCloud-popupWindow-background remoCloud-popupWindow-background-profileName">
        <div class="remoCloud-popupWindow remoCloud-input-popupWindow">
          <h5>Please input mkt file name</h5>
          <div class="remoCloud-popupWindow-profileName">
            <input 
              v-model="exportMktFileName"
              class="remoCloud-input" 
              ref="fileNameInput"
              type="input" 
              placeholder="Input File Name"
              @keyup.enter="exportMktFile(), $refs.fileNameInput.blur()"
            >
          </div>
          <div class="remoCloud-profileName-bottom">
            <button class="remoCloud-button-implement" @click="exportMktFileWindow = false, exportMktFileName = ''">Cancel</button>
            <button class="remoCloud-button-implement" @click="exportMktFile">Submit</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- upload geofence mkt file popup window -->
    <transition>      
      <div v-if="uploadFileWindow" class="remoCloud-popupWindow-background remoCloud-popupWindow-background-profileName">
        <div class="remoCloud-popupWindow remoCloud-input-popupWindow">
          <h5>Please input .mkt file name</h5>
          <div>
            <input type="file" accept=".wkt" @change="onFileChange" style="margin: 50px auto;">
          </div>
          <div class="remoCloud-profileName-bottom">
            <button class="remoCloud-button-implement" @click="uploadFileWindow = false">Cancel</button>
            <button class="remoCloud-button-implement" @click="uploadToHereCloud">Submit</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>
<script>
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import '@/assets/commonControls.css'
export default {
  name: 'EagleEye',
  data() {
    return {
      RunLoading: false,
      WarningWindow: false,
      WarningMsg: '',
      ErrorMsgWindow: false,
      ErrorMsgArray: [],
      SuccessWindow: false,
      geofenceList: [],
      inputGeofenceNameWindow: false,
      newGeofenceId: '',
      newGeofenceName: '',
      newGeofenceType: '',
      newGeofenceLatlng: '',
      newGeofenceLatlngs: '',
      newGeofenceRadius: '',
      drawnItems: null,
      exportMktFileWindow: false,
      exportMktFileName: '',
      uploadFileWindow: false,
      wktFile: null,
      targetDeviceLatlng: [25.02334, 121.54853],
      targetDeviceRadius: 250,
      geofenceBorderColor: '#3388ff',
      geofenceFillColor: '##3388ff',
      deviceList: [
        {
          modelName: 'RK25',
          latlng: [25.02302, 121.54833]
        },
        {
          modelName: 'RS35',
          latlng: [25.022, 121.54912]
        },
        {
          modelName: 'RK95',
          latlng: [25.02136, 121.54499]
        },
        {
          modelName: 'RK25',
          latlng: [25.02334, 121.54853]
        }
      ],
      apiKey: 'NcN9JRPbjXaf2ywN-7_sAwlKpxOBO5hKauFC6FqAEkU',
      layerId: 'QQQ',
      geometries: [],
      msgLoading: false,
      showGeofenceInfoArray: [],
      recentDeviceIndex: -1,
      noDetectGeofences: []
    }
  },
  created() {
    this.fetchData()
  },
  mounted() {
    var map = L.map('map').setView([25.02206, 121.54912], 16)
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    // FeatureGroup is to store editable layers
    this.drawnItems = new L.FeatureGroup()
    map.addLayer(this.drawnItems)
    //  add draw toolbar
    var drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems
      },
      draw: {
        marker: false,
        circlemarker: false,
        rectangle: false,
        circle: false
      }
    })
    map.addControl(drawControl)
    // 創建資料庫的geofence
    this.renderGeofence()
    // create event
    map.on('draw:created', e => {
      var layer = e.layer
      // layer.options.color = this.geofenceBorderColor
      // layer.options.fillColor = this.geofenceFillColor
      // this.drawnItems.addLayer(layer.bindTooltip(e.name, {permanent: true, direction: 'center'}).openTooltip())
      this.newGeofenceType = e.layerType
      let data = layer.getLatLngs()
      console.log(e.layerType)
      if (e.layerType === 'polyline') {
        this.newGeofenceLatlngs = data.map(el => [el.lat, el.lng])
      } else {
        this.newGeofenceLatlngs = data[0].map(el => [el.lat, el.lng])
      }
      this.inputGeofenceNameWindow = true
    })
    // edit event
    map.on('draw:edited', e => {
      var layers = e.layers
      layers.eachLayer(layer => {
        const id = layer.options.id
        this.geofenceList[id].latlngs = layer.getLatLngs()
      })
    })
    // delete event
    map.on('draw:deleted', e => {
      var layers = e.layers
      layers.eachLayer(layer => {
        this.geofenceList.splice(layer.options.id, 1)
      })
    })
  },
  methods: {
    fetchData() {
      let res = [
        {
          type: 'polygon',
          name: '公司',
          latlngs: [
            [25.022371713079654, 121.54904408370575],
            [25.021895341186735, 121.54902798613983],
            [25.02191478497365, 121.54929627890544],
            [25.02178353935215, 121.54939286430107],
            [25.02208005703811, 121.54967725463266]
          ]
        },
        {
          type: 'polygon',
          name: '倉儲',
          latlngs: [
            [25.0234126874309, 121.548021479887],
            [25.0229431631867, 121.54801402434],
            [25.0229296516711, 121.548427807161],
            [25.0234194431623, 121.548427807161],
            [25.0234126874309, 121.548021479887]
          ]
        },
        {
          type: 'polyline',
          name: '臥龍街',
          latlngs: [
            [25.024604909534858, 121.54671589178606],
            [25.023457745978977, 121.54659784296918],
            [25.022349459140493, 121.54710223336855],
            [25.02079395196251, 121.5482505264054]
          ]
        },
        {
          type: 'polygon',
          name: '銀行',
          latlngs: [
            [25.025411806290656, 121.54906627543384],
            [25.02470212629254, 121.54904480663859],
            [25.02467577144474, 121.5494627974432],
            [25.025191019085426, 121.5494627974432],
            [25.025404894829304, 121.54935008626815]
          ]
        }
      ]
      this.geofenceList = res
      this.geofenceList.forEach(() => {
        this.showGeofenceInfoArray.push(false)
      })
      this.targetDeviceLatlng = this.deviceList[0].latlng
    },
    test() {
      console.log(this.geofenceList)
    },
    renderGeofence() {
      let drawnItems = this.drawnItems
      drawnItems.clearLayers()
      // 創建目標Device的marker與範圍
      console.log(this.targetDeviceLatlng)
      const deviceIcon = L.icon({
        iconUrl: '/src/assets/marker-icon.png',
        iconAnchor: [10, 38]
      })
      L.marker(this.targetDeviceLatlng, {icon: deviceIcon}).addTo(drawnItems)
      L.circle(this.targetDeviceLatlng, {radius: this.targetDeviceRadius, color: '#ff0000', fillOpacity: 0}).addTo(drawnItems)
      this.geofenceList.forEach((el, index) => {
        // let geofenceOptions = {color: '#ed3f1d', fillColor: '#f6c3c0'}
        let tooltipOptions = {permanent: true, direction: 'center'}
        if (el.type === 'polygon') {
          L.polygon(el.latlngs, {id: index}).bindTooltip(el.name, tooltipOptions).addTo(drawnItems).openTooltip()
        } else if (el.type === 'polyline') {
          L.polyline(el.latlngs, {id: index}).bindTooltip(el.name, tooltipOptions).addTo(drawnItems).openTooltip()
        } else if (el.type === 'rectangle') {
          L.rectangle(el.latlngs, {id: index}).bindTooltip(el.name, tooltipOptions).addTo(drawnItems).openTooltip()
        } else if (el.type === 'circle') {
          L.circle(el.latlngs, {radius: el.radius}).bindTooltip(el.name, tooltipOptions).addTo(drawnItems).openTooltip()
        }
      })
    },
    createNewGeofence() {
      let type = this.newGeofenceType
      let name = this.newGeofenceName
      if (type === 'circle') {
        this.geofenceList.push({
          type: type,
          name: name,
          latlngs: this.newGeofenceLatlng,
          radius: this.newGeofenceRadius
        })
      } else {  // polyline, polygon, rectangle
        this.geofenceList.push({
          type: type,
          name: name,
          latlngs: this.newGeofenceLatlngs
        })
      }
      this.inputGeofenceNameWindow = false
      this.newGeofenceName = ''
      this.newGeofenceType = ''
      this.renderGeofence()
    },
    getGeometries() {
      const config = {
        params: {
          apiKey: this.apiKey,
          in: `point:${this.targetDeviceLatlng[0]}, ${this.targetDeviceLatlng[1]};r=${this.targetDeviceRadius}`,
          layers: this.layerId
        }
      }
      this.msgLoading = true
      axios.get('https://geofencing.hereapi.com/v8/geofence', config)
        .then(response => {
          this.msgLoading = false
          this.noDetectGeofences = []
          this.geometries = response.data.geometries
          // 取得沒偵測到的圍籬
          let geometriesName = this.geometries.map(el => el.attributes.NAME)
          this.geofenceList.forEach(geofence => {
            let isDetect = geometriesName.includes(geofence.name)
            if (!isDetect) {
              this.noDetectGeofences.push(geofence.name)
            }
          })
        })
    },
    exportMktFile() {
      if (this.exportMktFileName === '') {
        this.ShowErrorMsg('export file', 'File name can not be empty.')
        return
      }
      let csvContent = 'data:text/csv;charset=utf-8,'
      csvContent += `NAME\tWKT\n`
      this.geofenceList.forEach(el => {
        let polygon = 'MULTIPOLYGON ((('
        el.latlngs.forEach((latlng, index) => {
          console.log(latlng)
          if (index === el.latlngs.length - 1) {
            polygon += `${latlng[1]} ${latlng[0]})))`
          } else {
            polygon += `${latlng[1]} ${latlng[0]},`
          }
        })
        console.log(polygon)
        csvContent += `${el.name}\t${polygon}\n`
      })
      console.log(csvContent)
      const data = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', data)
      link.setAttribute('download', this.exportMktFileName + '.wkt')
      link.click()
      this.exportMktFileWindow = false
    },
    onFileChange(e) {
      console.log(e)
      const formData = new FormData()
      formData.append('zipfile', e.target.files[0])
      this.wktFile = formData
    },
    uploadToHereCloud() {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        params: {
          apiKey: this.apiKey,
          layer_id: this.layerId
        }
      }
      this.RunLoading = true
      axios.post('https://fleet.ls.hereapi.com/2/layers/upload.json', this.wktFile, config).then(res => {
        console.log(res)
        this.RunLoading = false
        this.wktFile = null
        this.uploadFileWindow = false
        this.SuccessWindow = true
      })
    },
    clickDeviceItem(index, latlng) {
      if (this.showGeofenceInfoArray[index]) {
        this.showGeofenceInfoArray[index] = false
        this.$forceUpdate()
      } else {
        this.showGeofenceInfoArray = this.showGeofenceInfoArray.map(() => false)
        this.showGeofenceInfoArray[index] = true
        if (this.recentDeviceIndex !== index) {
          this.recentDeviceIndex = index
          this.targetDeviceLatlng = latlng
          this.renderGeofence()
          this.getGeometries()
        }
      }
    },
    ShowErrorMsg(title, msg) {
      this.ErrorMsgArray.push({
        title: `Error in ${title}:`,
        description: msg
      })
      this.ErrorMsgWindow = true
    },
    closeWarnMsgWindow() {
      this.newGroupinfo = this.groupinfo
      this.newNonegroupDevicesArray = this.nonegroupDevicesArray
      this.$router.push(this.leavePagePath)
    },
    closeMsgWindow() {
      this.ErrorMsgWindow = false
      this.ErrorMsgArray = []
      this.SuccessWindow = false
    }
  }
}
</script>

<style src="@/assets//eagleEye.css">
  
</style>
