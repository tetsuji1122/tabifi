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
        const $$list = document.createElement('div');
        $$list.className = 'list';
        document.body.appendChild($$list);

        const $$nav = document.createElement('div');
        $$nav.className = 'nav';
        $$list.appendChild($$nav);

        const $$allSearch = document.createElement('button');
        $$nav.appendChild($$allSearch);
        $$allSearch.appendChild(document.createTextNode('周辺情報検索'));
        $$allSearch.className = 'all-search';


        $$allSearch.onclick = async () => {
            $$list.innerHTML = '';

            const items = await search(2000, window.nowItem.lat, window.nowItem.lng);
            const $$title = document.createElement('h5');
            $$title.innerHTML = `文化財一覧`;
            $$list.appendChild($$title);
            for (let item of items) {
                const $$row = document.createElement('div');
                const $$a = document.createElement('a');
                $$row.appendChild($$a);
                $$list.appendChild($$row);
                $$a.innerHTML = `${item.name}`


                let marker = null;
                $$a.onclick = async (e) => {
                    e.preventDefault();

                    if (null == marker) {
                        marker = await onListItemClick(item);
                    } else {
                        marker.popper.openPopup();
                    }
                }
                $$a.href = ''

            }
            const cItems = await searchCulturalProperty(2000, window.nowItem.lat, window.nowItem.lng);
            const $$cTitle = document.createElement('h5');
            $$cTitle.innerHTML = `観光施設一覧`;
            $$list.appendChild($$cTitle);
            for (let item of cItems) {
                const $$row = document.createElement('div');
                const $$a = document.createElement('a');
                $$row.appendChild($$a);
                $$list.appendChild($$row);
                $$a.innerHTML = `${item.name}`

                let marker = null;
                $$a.onclick = async (e) => {
                    e.preventDefault();

                    if (null == marker) {
                        marker = await onListItemClick(item);
                    } else {
                        marker.popper.openPopup();
                    }

                }
                $$a.href = ''

            }

            $$list.appendChild($$nav);


        }

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

        const { lat, lng } = await new Promise((res, rej) => getLatLng(item.address, (item) => res(item), (error) => {

            console.error(error);
            alert('がんばりましたが\n位置情報が取得できませんでした。')
            rej(error)
        }));

        console.log({ lat, lng })

        if(null == lat){
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
            alert('近くに観光施設がありません。');
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
            alert('近くに観光施設がありません。');
            return [];
        }

        return json.resultsets.features.map(item => item.properties);
    }


    main();
})()