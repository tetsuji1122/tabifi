const point = L.icon({
    iconUrl: 'img/point.png', // 新しいアイコン画像のパス
    iconSize: [60, 60], // アイコンのサイズ [幅, 高さ]
    iconAnchor: [30, 60], // アイコンのアンカー位置 [横, 縦]
    popupAnchor: [0, -40],
});


function main() {

    const $$button = document.createElement('button');
    document.body.appendChild($$button);

    $$button.style.position = 'fixed';
    $$button.style.zIndex = 10000;
    $$button.style.bottom = '2rem';
    $$button.style.right = '1rem';
    $$button.appendChild(document.createTextNode('観光施設検索'));


    const $$list = document.createElement('div');
    $$list.className = 'list';
    document.body.appendChild($$list);


    $$button.onclick = async () => {
        const items = await search(2000, window.nowItem.lat, window.nowItem.lng);

        $$list.innerHTML = '';

        for (let item of items) {
            const $$row = document.createElement('div');
            const $$a = document.createElement('a');
            $$row.appendChild($$a);
            $$list.appendChild($$row);
            $$a.innerHTML = `${item.name}`
            $$a.onclick = (e) => {
                e.preventDefault();
                onListItemClick(item);
            }
            $$a.href = ''
        }

    };

}


/**
 * 
 * @param {{
 *  name: string;
 *  description : string;
 * }} item 
 */
async function onListItemClick(item) {

    console.log(item);

    const {lat, lng} = await new Promise((res) => getLatLng(item.address,(item) => res(item)));



    pinMap(window.map, {...item, lat, lng}, point)


}

function popItem(item) {
    return `
    <div>
        <div><strong>${item.name}</strong></div>
        <div>${item.description}</div>
    </div>
    `
     ;
}

function pinMap(map, item, icon) {
    const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);

    marker.bindPopup(popItem(item));

    marker.item = item;

}


async function search(distacne, lat, lon) {
    const url = `https://wapi.bodik.jp/tourism`;

    const params = new URLSearchParams({
        distacne, maxResults: 20, select_type: 'data', lat, lon
    });

    const resp = await fetch(`${url}?${params.toString()}`);

    const json = await resp.json();

    const nextDist = distacne * 5; //meter;

    if (json.metadata.totalCount == 0) {
        if (nextDist > 100 * 1000) {
            alert('近くに観光施設がありません。');
            return [];
        }

        return await search(nextDist, lat, lon)
    }
    return json.resultsets.features.map(item => item.properties);
}

async function search(distacne, lat, lon) {
    const url = `https://wapi.bodik.jp/tourism`;

    const params = new URLSearchParams({
        distacne, maxResults: 20, select_type: 'data', lat, lon
    });

    const resp = await fetch(`${url}?${params.toString()}`);

    const json = await resp.json();

    const nextDist = distacne * 5; //meter;

    if (0 < json.metadata.totalCount) {
        return json.resultsets.features.map(item => item.properties);
    }

    if (nextDist > 100 * 1000) {
        return await searchTown(window.nowItem.pref, window.nowItem.city);
    }

    return await search(nextDist, lat, lon)
}

async function searchTown(pref, city) {
    const url = `https://wapi.bodik.jp/tourism`;

    const params = new URLSearchParams({
        maxResults: 20, select_type: 'data', prefectureName: pref, /* cityName: city */
    });

    const resp = await fetch(`${url}?${params.toString()}`);

    const json = await resp.json();

    if (json.metadata.totalCount == 0) {
        alert('近くに観光施設がありません。');
        return [];
    }

    return json.resultsets.features.map(item => item.properties);
}


main();