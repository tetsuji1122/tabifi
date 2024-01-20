let WAIT_SECOND = 1000; //APIの再取得時間（ミリ秒）
let INIT_LATITUDE = 35.6337; //緯度（初期値）
let INIT_LONGITUDE = 139.6917; //経度（初期値）
let INIT_ZOOM = 5;

//地図データの取得用
var map = null;
var dartsMarker = null;
var pin ;

//地図の初期化
function initMap () {
    // 地図の初期化
    map = L.map('map').setView([INIT_LATITUDE, INIT_LONGITUDE], INIT_ZOOM); // 初期の中心座標とズームレベル

    // タイルレイヤーの追加（OpenStreetMapのデフォルトタイル）
    L.tileLayer('https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}.png', {
        attribution: 'Maptiles by MIERUNE, Data by OpenStreetMap contributors'
    }).addTo(map);

    pin = L.icon({
        iconUrl: 'img/pin.png', // 新しいアイコン画像のパス
        iconSize: [60, 60], // アイコンのサイズ [幅, 高さ]
        iconAnchor: [30, 60], // アイコンのアンカー位置 [横, 縦]
        popupAnchor: [0, -40],
    });

    //WiFiの登録されている都道府県情報を読み込む
    datasetting();

}

//WiFiの登録されている都道府県情報を読み込む
let dataset = null;//
function datasetting() {
    if (dataset == null) {
        fetch('data/data_set.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("dataset data is loaded");
            dataset = data;
            findWiFi();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });    
    }
}

//ランダムに地域を選んでWiFiをさがす
let wifiinfo = null;
function findWiFi() {
    if (dataset == null) return;
    loadstart();
    //ランダムに地域を取得
    const randomIndex = Math.floor(Math.random() * dataset.length);
    const randomValue = dataset[randomIndex];
    console.log(randomValue);
    //指定された地域のWiFi情報を取得
    let municipalityCode = randomValue.organ_code;
    fetch('https://wapi.bodik.jp/public_wireless_lan?select_type=data&maxResults=10&distance=2000&municipalityCode='+municipalityCode)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log("dataset data is loaded:"+municipalityCode);
        console.log(data);
        if (data.metadata.totalCount == 0 ) {
            console.log("全国地方公共団体コード:"+municipalityCode+"で公衆無線LAN情報は取得できませんでした");
            console.log(WAIT_SECOND+"ミリ秒後に再度取得します。");
            setTimeout(function() {
                findWiFi();
            },WAIT_SECOND);
            return;
        }
        //取得した情報からひとつに決める
        let dataset = data.resultsets.features;
        const randomIndex = Math.floor(Math.random() * dataset.length);
        //WiFi情報のピンを指す
        wifiinfo = dataset[randomIndex].properties;
        setPinOfWiFi();
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        loadend();
    });    
}

//取得したWiFi情報にて地図にピンを指す
function setPinOfWiFi() {
    if (wifiinfo == null) return;
    if (dartsMarker != null) {//マーカーが設定されている場合は消す
        map.removeLayer(dartsMarker);
        dartsMarker = null;
    }
    console.log(wifiinfo);
    let address = wifiinfo.address;

    //住所情報から緯度経度を取得する　geoloniaのgeocoderを利用
    console.log(address);
    getLatLng(address, (item) => {
        console.log("lat:"+item.lat+" lng:"+item.lng);
        //現在地にピンを差して移動する
        dartsMarker = L.marker([item.lat, item.lng], { icon: pin }).addTo(map);
        dartsMarker.bindPopup(popupview(wifiinfo)).openPopup();
        dartsMarker.item = wifiinfo;//ピンの情報をセットする
        //地図の中心を変更する
        map.setView([item.lat, item.lng],9);
        loadend();

        window.nowItem = item;
    });
}

function popupview(wifiinfo) {
    return "<b>"+wifiinfo.municipalityName+"</b>"+"<br>"
     +wifiinfo.name+":"
     +wifiinfo.areaToProvide+"<br>"
     +"SSID:"+wifiinfo.ssid
     ;
}

function clickPinWiFi(e) {
    console.log("ピンがクリックされました");
    //e.openPopup();
}

function loadstart() {
    console.log("loadstart");
    document.getElementById("spinner").style.display = "block";
}

function loadend() {
    console.log("loadend");
    document.getElementById("spinner").style.display = "none";
}

//地図画面へ
function toMap() {
    window.location.href = "map.html";
}
  
//メイン画面へ
function toMain() {
    window.location.href = "index.html";
}


