import './scss/styles.scss'; // Подключаем стили

import { EventEmitter } from "./components/base/events";
import { AuctionAPI } from "./components/AuctionAPI";
import { API_URL, CDN_URL } from "./utils/constants";
import { AppData, CatalogChangeEvent, LotItem } from "./components/AppData";
import { Order } from "./components/Order";
import { Basket } from "./components/Basket";
import { Modal } from "./components/common/Modal";
import { cloneTemplate, createElement, ensureElement } from "./utils/utils";
import { Page } from './components/Page';
import { Tabs } from './components/common/Tabs';
import { CatalogItem } from './components/LotCard';

// Инициализация
const events = new EventEmitter();
const api = new AuctionAPI(CDN_URL, API_URL);
const appData = new AppData({}, events);

events.onAll(({ eventName, data }) => {
    console.log(eventName, data);
})

const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#preview');
const auctionTemplate = ensureElement<HTMLTemplateElement>('#auction');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#bid');
const bidsTemplate = ensureElement<HTMLTemplateElement>('#bids');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const tabsTemplate = ensureElement<HTMLTemplateElement>('#tabs');
const soldTemplate = ensureElement<HTMLTemplateElement>('#sold');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Глобальные контейнеры
const modalContainer = ensureElement<HTMLElement>('#modal-container');
const basketContainer = ensureElement<HTMLElement>('.basket');
const orderForm = ensureElement<HTMLFormElement>('.form');

// Компоненты
const modal = new Modal(modalContainer, events);
const basket = new Basket(cloneTemplate(basketTemplate), events);
const bids = new Basket(cloneTemplate(bidsTemplate), events)
const order = new Order(cloneTemplate(orderTemplate), events);
const page = new Page(document.body, events);
const tabs = new Tabs(cloneTemplate(tabsTemplate), {
    onClick: (name) => {
        if (name === 'closed') events.emit('basket:open');
        else events.emit('bids:open');
    }
});

// Загрузка данных с сервера
api.getLotList()
    .then(appData.setCatalog.bind(appData))
    .catch((err) => {
        console.error('Ошибка при загрузке лотов:', err);
    });

// Подписка на события

events.on<CatalogChangeEvent>('items:changed', () => {
    page.catalog = appData.catalog.map(item => {
        const card = new CatalogItem(cloneTemplate(cardCatalogTemplate), {
            onClick: () => events.emit('card:select', item)
        });
        return card.render({
            title: item.title,
            image: item.image,
            description: item.about,
            status: {
                status: item.status,
                label: item.statusLabel
            },
        });
    });

    page.counter = appData.getClosedLots().length;
});

events.on('bids:open', () => {
    modal.render({
        content: createElement<HTMLElement>('div', {}, [
            tabs.render({
                selected: 'active'
            }),
            bids.render()
        ])
    });
});

events.on('card:select', (item: LotItem) => {
    appData.setPreview(item);
});

events.on('modal:open', () => {
    page.locked = true;
});

events.on('modal:close', () => {
    page.locked = false;
});


