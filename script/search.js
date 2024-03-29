(() => {
    "use strict";

    const point = L.icon({
        iconUrl: 'img/pin_k.png', // 新しいアイコン画像のパス
        iconSize: [60, 60], // アイコンのサイズ [幅, 高さ]
        iconAnchor: [30, 60], // アイコンのアンカー位置 [横, 縦]
        popupAnchor: [0, -40],
    });


    function main() {
        //右ペイン
        //const $$list = document.createElement('div');
        // $$list.className = 'list';
        // $$list.id = 'list';
        // document.body.appendChild($$list);
        const $$list = document.getElementById('searchlist');

        //ボタンおきば
        // const $$nav = document.createElement('div');
        // $$nav.className = 'nav';
        // $$list.appendChild($$nav);

        const $$allSearch = document.getElementById('searchbtn');
        //$$nav.appendChild($$allSearch);
        //$$allSearch.appendChild(document.createTextNode('周辺情報検索'));
        //$$allSearch.className = 'all-search';

        $$allSearch.onclick = async () => {
            if (window.nowItem.items && window.nowItem.cItems) return;//すでに取得した場合は処理しない
            $$list.innerHTML = '';

            const items = await search(2000, window.nowItem.lat, window.nowItem.lng);
            window.nowItem.items = items;
            await renderList("観光施設", items, $$list);

            const cItems = await searchCulturalProperty(2000, window.nowItem.lat, window.nowItem.lng);
            window.nowItem.cItems = cItems;
            await renderList('文化財', cItems, $$list);

            //$$list.appendChild($$nav);
        }

    }

    async function renderList(title, items, $$list) {
        if (items.length == 0) return;

        const $$title = document.createElement('h6');
        $$title.innerHTML = title;
        $$title.className = "dropdown-header";
        $$list.appendChild($$title);

        for (let item of items) {
            const $$row = document.createElement('div');
            const $$a = document.createElement('a');
            $$a.className="dropdown-item";
            $$row.appendChild($$a);
            $$list.appendChild($$row);
            $$a.innerHTML = `${item.name}`

            let marker = null;
            $$a.onclick = async (e) => {
                e.preventDefault();

                if (null == marker) {
                    marker = await renderItem(item);
                } else {
                    marker.popper.openPopup();
                }
            }
            $$a.href = ''

        }
    }


    /**
     * 
     * @param {{
     *  name: string;
     *  description : string;
     *  address : string;
     * }} item 
     */
    async function renderItem(item) {

        console.log(item);

        const { lat, lng } = await new Promise((res, rej) => getLatLng(item.address, (item) => res(item), (error) => {

            console.error(error);
            alert('がんばりましたが\n位置情報が取得できませんでした。')
            rej(error)
        }));

        console.log({ lat, lng })

        if (null == lat) {
            alert('がんばりましたが\n位置情報が取得できませんでした。');
            return null;
        }

        const { marker, popper } = pinMap(window.map, { ...item, lat, lng }, point)


        return { m: marker, popper };

    }

    function popItem(item) {
        const content = `
    <div>
        <div><strong>${item.name}</strong></div>
        <div>${item.description}</div>
    </div>
    `;

        console.log(content)

        return content;
    }

    function pinMap(map, item, icon) {
        const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);

        const popper = marker.bindPopup(popItem(item));

        marker.item = item;

        return { marker, popper };

    }

    async function searchCulturalProperty(distacne, lat, lon) {
        const url = `https://wapi.bodik.jp/cultural_property`;
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
            return await searchTownCulturalProperty(window.nowItem.pref, window.nowItem.city);
        }
        return searchCulturalProperty(nextDist, lat, lon)

    }
    async function searchTownCulturalProperty(pref, city) {
        const url = `https://wapi.bodik.jp/cultural_property`;

        const params = new URLSearchParams({
            maxResults: 20, select_type: 'data', prefectureName: pref, /* cityName: city */
        });

        const resp = await fetch(`${url}?${params.toString()}`);

        const json = await resp.json();

        if (json.metadata.totalCount == 0) {
            //alert('近くに観光施設がありません。');
            return [];
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
            //alert('近くに観光施設がありません。');
            return [];
        }

        return json.resultsets.features.map(item => item.properties);
    }


    main();
})()