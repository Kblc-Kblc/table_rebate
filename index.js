// ===== 1) ССЫЛКИ/СОСТОЯНИЕ =====
console.log('JavaScript file loaded!');
let typeSelect, typeMenu, periodWrap, periodInput, tp, tpManual, tpBtnApply, tpBtnNow, weekChips;
let tpDropdown, tpAnchor, modalDialog, modal;

function initElements() {
  typeSelect   = document.getElementById('rbm-type');
  typeMenu     = document.getElementById('rbm-type-dropdown');
  periodWrap   = document.getElementById('period-field');
  periodInput  = document.getElementById('rbm-time');

  tp           = document.getElementById('tp-dropdown');
  tpManual     = document.getElementById('tp-manual');
  tpBtnApply   = tp?.querySelector('[data-act="apply"]');
  tpBtnNow     = tp?.querySelector('[data-act="now"]');
  weekChips    = tp?.querySelector('.week-chips');
  
  // Инициализируем элементы для позиционирования
  tpDropdown  = document.getElementById('tp-dropdown');
  tpAnchor    = document.getElementById('rbm-time');
  modalDialog = document.querySelector('.rb-modal__dialog');
  modal       = document.getElementById('rebate-modal');
  
  console.log('Элементы найдены:', {
    tpDropdown: !!tpDropdown,
    tpAnchor: !!tpAnchor,
    modalDialog: !!modalDialog,
    modal: !!modal
  });
}

// Функция инициализации select all checkbox
function initializeSelectAll() {
  const selectAll = document.getElementById('select-all');
  console.log('Initializing select all element:', selectAll);
  
  if (selectAll) {
    // Удаляем старые обработчики если они есть
    const newSelectAll = selectAll.cloneNode(true);
    selectAll.parentNode.replaceChild(newSelectAll, selectAll);
    
    // Добавляем новые обработчики
    newSelectAll.addEventListener('change', (e) => {
      console.log('Select all checkbox changed!', e.target.checked);
      handleSelectAll(e.target.checked);
    });
    
    const selectAllCell = newSelectAll.closest('.cell--chk');
    if (selectAllCell) {
      selectAllCell.addEventListener('click', (e) => {
        console.log('Select all container clicked!', e.target);
        // Если клик не по самому input, переключаем его состояние
        if (e.target !== newSelectAll) {
          e.preventDefault();
          e.stopPropagation();
          newSelectAll.checked = !newSelectAll.checked;
          console.log('Select all checkbox state changed to:', newSelectAll.checked);
          handleSelectAll(newSelectAll.checked);
        }
      });
    }
    
    function handleSelectAll(checked) {
      console.log('Handling select all:', checked);
      
      // Ищем selectAllCell более надежным способом
      let selectAllCell = newSelectAll.closest('.cell--chk');
      if (!selectAllCell) {
        // Если не нашли через closest, ищем по ID
        const selectAllElement = document.getElementById('select-all');
        if (selectAllElement) {
          selectAllCell = selectAllElement.closest('.cell--chk');
        }
      }
      
      console.log('Select all cell found:', selectAllCell);
      if (selectAllCell) {
        selectAllCell.classList.toggle('checked', checked);
        console.log('Select all cell classes after toggle:', selectAllCell.className);
      } else {
        console.log('Select all cell NOT found! Trying to reinitialize...');
        // Попробуем переинициализировать
        setTimeout(() => {
          initializeSelectAll();
        }, 50);
      }
      
      // Получаем активный контейнер (клиенты или операции)
      const activeContainer = document.querySelector('#clients-body') || document.querySelector('#operations-body');
      if (!activeContainer) {
        console.log('No active container found');
        return;
      }
      
      const rows = activeContainer.querySelectorAll('.rb-row');
      console.log('Found rows to update:', rows.length);
      console.log('Active container:', activeContainer.id);
      
      rows.forEach((row, index) => {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) {
          const cell = cb.closest('.cell--chk');
          cb.checked = checked;
          if (cell) {
            cell.classList.toggle('checked', checked);
          }
          row.classList.toggle('row-selected', checked);
          console.log(`Row ${index} checkbox checked:`, cb.checked);
        }
      });
      
      // Обновляем футер при изменении select-all с небольшой задержкой
      setTimeout(() => {
        updateFooter();
      }, 10);
    }
  } else {
    console.log('Select all element NOT found during initialization!');
  }
}

// Функция для синхронизации состояния select-all с состоянием строк
function syncSelectAllState() {
  const selectAll = document.getElementById('select-all');
  if (!selectAll) {
    console.log('Select all element not found in syncSelectAllState');
    return;
  }
  
  const selectAllCell = selectAll.closest('.cell--chk');
  if (!selectAllCell) {
    console.log('Select all cell not found in syncSelectAllState');
    return;
  }
  
  // Получаем активный контейнер
  const activeContainer = document.querySelector('#clients-body') || document.querySelector('#operations-body');
  if (!activeContainer) return;
  
  const rows = activeContainer.querySelectorAll('.rb-row');
  const checkedBoxes = activeContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  // Определяем состояние select-all на основе состояния строк
  const allChecked = rows.length > 0 && checkedBoxes.length === rows.length;
  const someChecked = checkedBoxes.length > 0;
  
  // Обновляем состояние checkbox
  selectAll.checked = allChecked;
  
  // Обновляем визуальные классы
  if (allChecked) {
    selectAllCell.classList.add('checked');
  } else if (someChecked) {
    selectAllCell.classList.add('checked'); // Показываем как частично выбранный
  } else {
    selectAllCell.classList.remove('checked');
  }
  
  console.log('Select all state synced:', {
    allChecked,
    someChecked,
    totalRows: rows.length,
    checkedRows: checkedBoxes.length
  });
}

const WEEKDAY_NOM = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
let tpMode = 'manual';         // 'manual' | 'auto-daily' | 'auto-weekly'
let tpSelectedWd = 'mon';      // выбранный день в weekly
const ROW = 44;                // высота строки в колесе

// Функция для получения текста тултипа в зависимости от номера аккаунта
function getAccountTooltip(account) {
  const tooltipData = {
    '35456000': 'Trading from MT5 account\nstarted on 24 Sep 2025',
    '55856010': 'Trading from OctaTrader account\nstarted on 25 Jun 2025',
    '95857091': 'Trading from OctaTrader account\nstarted on 9 Jun 2025',
    '43657012': 'Trading from MT5 account\nstarted on 31 Dec 2024',
    '54357034': 'Trading from OctaTrader account\nstarted on 16 Jun 2024'
  };
  return tooltipData[account] || 'Trading from OctaTrader account\nstarted on 25 Jun 2025';
}

// Функция для получения даты начала торговли для сортировки
function getTradingStartDate(account) {
  const dateMap = {
    '35456000': new Date('2025-09-24'), // 24 Sep 2025
    '55856010': new Date('2025-06-25'), // 25 Jun 2025
    '95857091': new Date('2025-06-09'), // 9 Jun 2025
    '43657012': new Date('2024-12-31'), // 31 Dec 2024
    '54357034': new Date('2024-06-16')  // 16 Jun 2024
  };
  return dateMap[account] || new Date('2025-06-25');
}

// Данные для вкладки "Клиенты и группы"
let rowsClients = [
  { name: 'John', account: '35456000', profit: 2, percent: 0, paid: 0, rebateType: null, rebateTypeText: null },
  { name: 'Anna', account: '55856010', profit: 2, percent: 0, paid: 0, rebateType: null, rebateTypeText: null },
  { name: 'id948484', account: '95857091', profit: 2, percent: 0, paid: 0, rebateType: null, rebateTypeText: null },
  { name: 'Mary', account: '43657012', profit: 2, percent: 0, paid: 0, rebateType: null, rebateTypeText: null },
  { name: 'Peter', account: '54357034', profit: 1, percent: 0, paid: 0, rebateType: null, rebateTypeText: null },
];

// Данные для вкладки "Trade Payout Approval" - генерируются динамически
let rowsOperations = [];

// Текущие данные (по умолчанию - клиенты)
let rows = rowsClients;

// Переменные для фильтрации операций по клиенту
let isFilteredMode = false; // флаг фильтрованного режима
let filteredOperations = []; // отфильтрованные данные
let originalSortState = null; // сохраняем оригинальную сортировку
let filteredClientName = ''; // имя клиента для фильтрации

// Глобальная переменная для определения типа данных
let isOperationsData = false;

// Функция генерации операций на основе данных клиентов
function generateOperationsFromClients() {
  console.log('=== ГЕНЕРАЦИЯ ОПЕРАЦИЙ НА ОСНОВЕ КЛИЕНТОВ ===');
  
  try {
    // Очищаем массив операций перед генерацией новых
    rowsOperations = [];
    console.log('Очищен массив операций');
    
    // Если мы в фильтрованном режиме, также очищаем отфильтрованные операции
    if (isFilteredMode) {
      filteredOperations = [];
      console.log('Очищены отфильтрованные операции');
    }
  
  rowsClients.forEach((client, index) => {
    // Проверяем, настроен ли ребейт у клиента
    const hasRebateType = client.rebateType && (client.rebateType === 'manual' || client.rebateType === 'auto');
    const hasPercent = client.percent && client.percent > 0;
    const isConfigured = hasRebateType || hasPercent;
    
    console.log(`Клиент ${client.name}: hasRebateType=${hasRebateType}, hasPercent=${hasPercent}, isConfigured=${isConfigured}`);
    
    // Генерируем операции только для клиентов с настроенным ребейтом
    if (isConfigured) {
      const operationTypes = ['Покупка', 'Продажа'];
      const statuses = ['Approved', 'Pending'];
      const dates = ['2024-01-15', '2024-01-14', '2024-01-13', '2024-01-12', '2024-01-11'];
      
      // Создаем 2-4 операции для каждого настроенного клиента
      const numOperations = Math.floor(Math.random() * 3) + 2; // 2-4 операции
      
      for (let i = 0; i < numOperations; i++) {
        const operationType = operationTypes[Math.floor(Math.random() * operationTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = dates[Math.floor(Math.random() * dates.length)];
        
        // Используем процент клиента или генерируем случайный
        const percent = client.percent || Math.floor(Math.random() * 25) + 5; // 5-30%
        const paid = client.profit * (percent / 100);
        
        const operation = {
          id: `${client.name}_${client.account}_${Date.now()}_${Math.random()}`, // Уникальный ID
          name: client.name,
          account: client.account,
          profit: client.profit,
          percent: percent,
          paid: paid,
          operationType: client.rebateTypeText || operationType, // Используем тип выплаты клиента
          status: status,
          date: date
        };
        
        rowsOperations.push(operation);
        console.log(`Создана операция для настроенного клиента ${client.name}:`, operation);
      }
    } else {
      console.log(`Клиент ${client.name} не настроен, операции не создаются`);
    }
  });
  
    console.log(`Сгенерировано ${rowsOperations.length} операций для ${rowsClients.filter(c => c.rebateType || c.percent > 0).length} настроенных клиентов из ${rowsClients.length} общих`);
    
    // Если мы в фильтрованном режиме, обновляем отфильтрованные операции
    if (isFilteredMode && filteredClientName) {
      filteredOperations = rowsOperations.filter(operation => operation.name === filteredClientName);
      console.log(`Обновлены отфильтрованные операции для клиента ${filteredClientName}: ${filteredOperations.length} операций`);
    }
    
    return rowsOperations;
  } catch (error) {
    console.error('Ошибка при генерации операций:', error);
    rowsOperations = [];
    return [];
  }
}


// Глобальная переменная для отслеживания текущего клиента в модальном окне
let currentModalClient = null;

// ===== 2) ВСПОМОГАТЕЛЬНЫЕ =====
function show(el, v){ el.style.display = v ? '' : 'none'; }
function validate(hhmm){ if(!/^\d{2}:\d{2}$/.test(hhmm)) return false; const [h,m]=hhmm.split(':').map(Number); return h>=0&&h<24&&m>=0&&m<60; }
function roundedNow(step=15){ const d=new Date(); const r=Math.round(d.getMinutes()/step)*step; const mm=r===60?0:r; const hh=(d.getHours()+(r===60?1:0))%24; return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'); }
function hourNoLead(h){ return String(parseInt(h,10)); }
function minutes2(m){ return String(parseInt(m,10)).padStart(2,'0'); }
function parseHHMM(v){ const m=(v||'').match(/^(\d{1,2}):(\d{2})$/); return m ? [hourNoLead(m[1]).padStart(2,'0'), minutes2(m[2])] : ['09','00']; }
function getFieldTime(){ const m=(periodInput.value||'').match(/(\d{1,2}:\d{2})$/); return m?m[1].padStart(5,'0'):null; }
function getFieldWeekdayKey(){
  const m=(periodInput.value||'').match(/^Every\s+(\S+)/i);
  if(!m) return 'mon';
  const found = Object.entries(WEEKDAY_NOM).find(([,name])=>name.toLowerCase()===m[1].toLowerCase());
  return found?found[0]:'mon';
}
function setWeekChipActive(key){
  tpSelectedWd = key;
  weekChips?.querySelectorAll('.chip').forEach(c=>{
    const on = c.dataset.wd === key;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-selected', on?'true':'false');
  });
}

// ===== ПОЗИЦИОНИРОВАНИЕ ПОПОВЕРА =====
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

/** Позиционируем поповер под якорём (аналог monthly) */
function positionPopover(anchorEl, popEl, gap = 8){
  console.log('positionPopover вызвана', { anchorEl, popEl, gap });
  if (!anchorEl || !popEl) {
    console.log('Элементы не найдены:', { anchorEl, popEl });
    return;
  }
  const r = anchorEl.getBoundingClientRect();
  const popW = popEl.offsetWidth || 360; // ожидаемая ширина
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;

  console.log('Размеры:', { r, popW, vw, vh });

  // Базовые координаты — слева по якорю, снизу + gap
  let left = r.left;
  let top  = r.bottom + gap;

  // Если вылезаем вправо — прижимаем к правому краю вьюпорта
  if (left + popW > vw - 8) left = clamp(vw - popW - 8, 8, vw - popW);

  // Если не помещается снизу — показываем над полем
  const popH = popEl.offsetHeight || 420;
  if (top + popH > vh - 8) top = clamp(r.top - popH - gap, 8, vh - popH);

  console.log('Финальные координаты:', { left, top });

  popEl.style.left = Math.round(left) + 'px';
  popEl.style.top  = Math.round(top)  + 'px';

  // Выровнять «носик» под центр инпута, но не дальше 24px от левого края поповера
  const caretX = clamp(r.width / 2, 16, 32);
  popEl.style.setProperty('--caret-x', `${caretX}px`);
}

let _repositionBound = false;
function attachRepositionHandlers(){
  if (_repositionBound) return;
  _repositionBound = true;

  const reflow = () => {
    if (tpDropdown.style.display !== 'block') return;
    positionPopover(tpAnchor, tpDropdown, 8);
  };

  window.addEventListener('resize', reflow);
  window.addEventListener('scroll', reflow, { passive: true });
  // если у диалога есть внутренний скролл — слушаем и его
  modalDialog?.addEventListener('scroll', reflow, { passive: true });
}

// ===== 3) КОЛЁСА ВРЕМЕНИ =====
let wheelH, wheelM;
function buildWheel(el, count){
  if(!el) return;
  el.innerHTML = Array.from({length:count}, (_,i)=>`<div class="item">${String(i).padStart(2,'0')}</div>`).join('');
}
function scrollToIndex(el, idx){ el.scrollTo({ top: idx*ROW - (el.clientHeight/2 - ROW/2), behavior:'auto' }); }
function nearestIndex(el){ return Math.max(0, Math.round((el.scrollTop + el.clientHeight/2)/ROW - 0.5)); }
function syncManualFromWheels(){
  const hh = String(nearestIndex(wheelH)).padStart(2,'0');
  const mm = String(nearestIndex(wheelM)).padStart(2,'0');
  tpManual.value = `${hh}:${mm}`;
  tpBtnApply.disabled = !validate(tpManual.value);
}

// ===== 4) ОТКРЫТИЕ/ЗАКРЫТИЕ ТАЙМПИКЕРА =====
function openTimepicker(){
  console.log('openTimepicker вызвана');
  // режим — из выбранного типа
  const modeVal = typeSelect.dataset.value || 'manual';
  tpMode = modeVal;
  console.log('Режим:', tpMode);

  // показать/скрыть чипсы по режиму
  show(weekChips, tpMode==='auto-weekly');

  // Показываем поповер и позиционируем его
  console.log('Показываем таймпикер');
  tpDropdown.style.display = 'block';
  console.log('tpDropdown после показа:', tpDropdown.style.display);
  
  // сначала показать — затем позиционировать (чтобы были доступны offsetWidth/Height)
  console.log('Позиционируем поповер');
  positionPopover(tpAnchor, tpDropdown, 8);

  // подписки на обновление позиции
  attachRepositionHandlers();

  // префилл: день и время
  if(tpMode==='auto-weekly'){ setWeekChipActive(getFieldWeekdayKey()); }
  const t = getFieldTime() || roundedNow(15);
  const [hh,mm] = parseHHMM(t);
  tpManual.value = `${hh}:${mm}`;
  scrollToIndex(wheelH, parseInt(hh,10));
  scrollToIndex(wheelM, parseInt(mm,10));
  tpBtnApply.disabled = !validate(tpManual.value);
  tpManual.focus(); tpManual.select();
}
function closeTimepicker(){ 
  if (tpDropdown) {
    tpDropdown.style.display='none'; 
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ ТАЙМПИКЕРА =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired!');
  initElements();
  
  // Инициализируем select all checkbox
  initializeSelectAll();
  
  // Инициализируем текст для активной вкладки (Клиенты и группы по умолчанию)
  const cardSub = document.querySelector('.card-sub');
  if (cardSub) {
    cardSub.innerHTML = 'Clients who haven\'t started trading yet are listed in the report <a href="#">My clients</a> <span class="arrow-8" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  }
  
  // Генерируем операции на основе данных клиентов
  generateOperationsFromClients();
  
  // Инициализация контекстного меню
  initContextMenu();
  
  // Инициализируем колёса только если они существуют в DOM
  const initialWheelH = document.getElementById('wheel-hours');
  const initialWheelM = document.getElementById('wheel-minutes');
  
  if (initialWheelH && initialWheelM) {
    wheelH = initialWheelH;
    wheelM = initialWheelM;
    buildWheel(wheelH, 24);
    buildWheel(wheelM, 60);
    
    [wheelH, wheelM].forEach(el=>{
      if(!el) return;
      el.addEventListener('scroll', ()=>{ clearTimeout(el._t); el._t=setTimeout(()=>{ scrollToIndex(el, nearestIndex(el)); syncManualFromWheels(); }, 80); });
    });
  }

  // ===== 5) СЕЛЕКТ ТИПА РЕЖИМА =====
  typeSelect.addEventListener('click', ()=>{
    show(typeMenu, typeMenu.style.display==='none');
  });
  typeMenu.addEventListener('click', (e)=>{
    const opt = e.target.closest('.dropdown-option'); if(!opt) return;
    typeSelect.dataset.value = opt.dataset.value; // manual | auto-daily | auto-weekly | ...
    typeSelect.querySelector('.select-value').textContent = opt.textContent.trim();
    show(typeMenu, false);

    const isAuto = opt.dataset.value==='auto-daily' || opt.dataset.value==='auto-weekly' || opt.dataset.value==='auto-monthly';
    show(periodWrap, isAuto);

    // Устанавливаем значение по умолчанию при смене режима
    if(opt.dataset.value==='auto-daily'){
      periodInput.value = 'Every day 09:00';
      periodInput.placeholder = '';
    }
    if(opt.dataset.value==='auto-weekly'){
      periodInput.value = 'Every Monday 09:00';
      periodInput.placeholder = '';
    }
    if(opt.dataset.value==='auto-monthly'){
      periodInput.value = 'Every 1st of the month 09:00';
      periodInput.placeholder = '';
    }
  });

  // ===== 6) ОТКРЫТИЕ ПО КЛИКУ НА ПОЛЕ ПЕРИОДА =====
  periodInput.addEventListener('click', (e)=>{
    console.log('Поле периода кликнуто');
    const modeVal = typeSelect.dataset.value || 'manual';
    console.log('Режим:', modeVal);
    if(modeVal==='auto-daily' || modeVal==='auto-weekly' || modeVal==='auto-monthly'){ 
      console.log('Открываем таймпикер');
      openTimepicker(); 
    }
  });
  
  // Также добавляем обработчик для иконки времени
  const timeIcon = document.querySelector('.rb-time-icon, .time-icon');
  if(timeIcon) {
    timeIcon.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const modeVal = typeSelect.dataset.value || 'manual';
      if(modeVal==='auto-daily' || modeVal==='auto-weekly' || modeVal==='auto-monthly'){ 
        openTimepicker(); 
      }
    });
  }

  // ===== 7) ЧИПСЫ ДНЕЙ НЕДЕЛИ (ТОЛЬКО ДЛЯ WEEKLY) =====
  weekChips?.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip'); if(!chip) return;
    setWeekChipActive(chip.dataset.wd);
  });

  // ===== 8) ИНПУТ HH:MM В ТАЙМПИКЕРЕ =====
  tpManual.addEventListener('input', (e)=>{
    let v = e.target.value.replace(/[^0-9]/g,'').slice(0,4);
    if(v.length>=3) v = v.slice(0,2)+':'+v.slice(2);
    e.target.value = v;
    tpBtnApply.disabled = !validate(v);
    if(validate(v)){
      const [hh,mm] = v.split(':').map(Number);
      scrollToIndex(wheelH, hh);
      scrollToIndex(wheelM, mm);
    }
  });
  tpManual.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !tpBtnApply.disabled) tpBtnApply.click(); if(e.key==='Escape') closeTimepicker(); });

  // ===== 9) "NOW" AND "APPLY" BUTTONS =====
  tpBtnNow.addEventListener('click', ()=>{
    const v = roundedNow(15);
    tpManual.value = v;
    tpBtnApply.disabled = !validate(v);
    const [hh,mm] = v.split(':').map(Number);
    scrollToIndex(wheelH, hh);
    scrollToIndex(wheelM, mm);
  });

  tpBtnApply.addEventListener('click', ()=>{
    if(!validate(tpManual.value)) return;
    const [hh,mmRaw] = tpManual.value.split(':');
    const outH = hourNoLead(hh), outM = minutes2(mmRaw);

    if(tpMode==='auto-weekly'){
      const dayName = WEEKDAY_NOM[tpSelectedWd] || WEEKDAY_NOM.mon;
      periodInput.value = `Every ${dayName} ${outH}:${outM}`;
    } else if(tpMode==='auto-monthly'){
      periodInput.value = `Every 1st of the month ${outH}:${outM}`;
    } else {
      periodInput.value = `Every day ${hh}:${mmRaw}`;
    }
    closeTimepicker();
  });

  // Обработчики для закрытия таймпикера
  document.addEventListener('click', (e)=>{
    if(tpDropdown.style.display!=='block') return;
    
    // Не закрываем dropdown если клик внутри dropdown'а
    if(e.target.closest('#tp-dropdown')) return;
    
    // Не закрываем dropdown если клик по полю ввода времени
    if(e.target === periodInput) return;
    
    // Закрываем dropdown если клик по селекту типа выплаты
    if(e.target.closest('#rbm-type')) {
      closeTimepicker();
      return;
    }
    
    // Не закрываем dropdown если клик внутри модального окна (кроме самого dropdown'а)
    if(e.target.closest('.rb-modal__dialog')) return;
    
    // Закрываем dropdown во всех остальных случаях
    closeTimepicker();
  });
  
});

// Функция для отображения типа ребейта в таблице
function getRebateTypeDisplay(clientName) {
  console.log('getRebateTypeDisplay вызвана для клиента:', clientName);
  console.log('Доступные имена в rows:', rows.map(r => r.name));
  console.log('Полные данные rows:', rows.map(r => ({
    name: r.name,
    rebateType: r.rebateType,
    rebateTypeText: r.rebateTypeText,
    percent: r.percent,
    rebateSchedule: r.rebateSchedule
  })));
  
  // Улучшенный поиск клиента
  let row = rows.find(r => r.name === clientName);
  
  // Если точное совпадение не найдено, попробуем частичное
  if (!row) {
    console.log('Точное совпадение не найдено, ищем по частичному совпадению...');
    row = rows.find(r => {
      const rowName = r.name.toLowerCase().trim();
      const clientNameLower = clientName.toLowerCase().trim();
      return (rowName.includes(clientNameLower) && clientNameLower.length >= 3) || 
             (clientNameLower.includes(rowName) && rowName.length >= 3);
    });
  }
  
  console.log('getRebateTypeDisplay для клиента:', clientName, 'найденная строка:', row);
  
  if (!row) {
    console.log('Строка не найдена, возвращаем "Not set"');
    return 'Not set';
  }
  
  if (!row.rebateType) {
    console.log('rebateType отсутствует, возвращаем "Not set"');
    console.log('row:', row, 'rebateType:', row?.rebateType);
    return 'Not set';
  }
  
  if (row.rebateType === 'manual') {
    console.log('Возвращаем "Manual" для manual типа');
    return 'Manual';
  } else if (row.rebateType === 'auto') {
    console.log('Возвращаем "Auto" для auto типа');
    console.log('rebateSchedule:', row.rebateSchedule);
    const scheduleText = row.rebateSchedule || 'Время не указано';
    return `Auto <span class="rebate-info-icon" data-tooltip="${scheduleText}" aria-label="Инфо">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.25">
          <path d="M8.66667 10.6667H8V8H7.33333M8 5.33333H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      </svg>
    </span>`;
  }
  
  return 'Not set';
}

// Функция для отображения процента ребейта в таблице
function getPercentDisplay(percent) {
  if (percent === null || percent === undefined || percent === 0) {
    return 'Not set';
  }
  return `${percent}%`;
}

// Функция для отображения суммы выплат в таблице
function getPaidDisplay(paid) {
  return `${paid} USD`;
}


// Функция для определения содержимого кнопки "Set Rebate"
function getButtonText(rebateType, percent) {
  const hasRebateType = rebateType && (rebateType === 'manual' || rebateType === 'auto');
  const hasPercent = percent && percent > 0;
  const isConfigured = hasRebateType || hasPercent;
  
  if (isConfigured) {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3.33073 8.00004H3.3374M7.9974 8.00004H8.00406M12.6641 8.00004H12.6707M3.9974 8.00004C3.9974 8.36823 3.69892 8.66671 3.33073 8.66671C2.96254 8.66671 2.66406 8.36823 2.66406 8.00004C2.66406 7.63185 2.96254 7.33337 3.33073 7.33337C3.69892 7.33337 3.9974 7.63185 3.9974 8.00004ZM8.66406 8.00004C8.66406 8.36823 8.36559 8.66671 7.9974 8.66671C7.62921 8.66671 7.33073 8.36823 7.33073 8.00004C7.33073 7.63185 7.62921 7.33337 7.9974 7.33337C8.36559 7.33337 8.66406 7.63185 8.66406 8.00004ZM13.3307 8.00004C13.3307 8.36823 13.0323 8.66671 12.6641 8.66671C12.2959 8.66671 11.9974 8.36823 11.9974 8.00004C11.9974 7.63185 12.2959 7.33337 12.6641 7.33337C13.0323 7.33337 13.3307 7.63185 13.3307 8.00004Z" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  }
  
  return 'Set Rebate';
}

// Функция для определения класса кнопки
function getButtonClass(rebateType, percent) {
  const hasRebateType = rebateType && (rebateType === 'manual' || rebateType === 'auto');
  const hasPercent = percent && percent > 0;
  const isConfigured = hasRebateType || hasPercent;
  
  return isConfigured ? 'btn rebate-setup-btn no-border' : 'btn rebate-setup-btn';
}

// Функция для показа контекстного меню
function showContextMenu(event, clientName, accountId) {
  // Получаем ID операции из кнопки - ищем ближайшую кнопку с data-operation-id
  const button = event.target.closest('button[data-operation-id]');
  const operationId = button ? button.getAttribute('data-operation-id') : null;
  console.log('=== ПОКАЗ КОНТЕКСТНОГО МЕНЮ ===');
  console.log('Client name:', clientName);
  console.log('Account ID:', accountId);
  console.log('Operation ID:', operationId);
  console.log('Button found:', button);
  
  // Определяем, какое меню показывать
  let contextMenu, menuHeight;
  
  // Проверяем, находимся ли мы в режиме операций и определяем статус
  if (isOperationsData) {
    console.log('In operations data mode, looking for status...');
    
    // Сначала попробуем найти строку по кнопке (самый надежный способ)
    const buttonRow = event.target.closest('.rb-row');
    console.log('Button row found:', buttonRow);
    
    if (buttonRow) {
      const statusBadge = buttonRow.querySelector('.status-badge');
      console.log('Status badge found in button row:', statusBadge);
      
      if (statusBadge) {
        const status = statusBadge.textContent.trim();
        console.log('Status text from button row:', status);
        
        if (status === 'Pending') {
          // Показываем меню для операций в ожидании
          contextMenu = document.getElementById('approval-menu');
          menuHeight = 80; // высота меню для 2 пунктов
          console.log('Showing approval menu for pending status');
        } else if (status === 'Approved') {
          // Показываем меню для аппрувленных операций
          contextMenu = document.getElementById('approved-menu');
          menuHeight = 80; // высота меню для 2 пунктов
          console.log('Showing approved menu for approved status');
        } else if (status === 'Rejected') {
          // Показываем меню для зареджекченных операций
          contextMenu = document.getElementById('rejected-menu');
          menuHeight = 80; // высота меню для 2 пунктов
          console.log('Showing rejected menu for rejected status');
        } else {
          console.log('Unknown status:', status);
        }
      } else {
        console.log('Status badge not found in button row');
      }
    } else {
      console.log('Button row not found, trying alternative methods...');
      
      // Попробуем найти строку по data-client атрибуту
      const operationRow = document.querySelector(`[data-client="${clientName}"]`)?.closest('.rb-row');
      console.log('Operation row found by data-client:', operationRow);
      
      if (operationRow) {
        const statusBadge = operationRow.querySelector('.status-badge');
        console.log('Status badge found in operation row:', statusBadge);
        
        if (statusBadge) {
          const status = statusBadge.textContent.trim();
          console.log('Status text from operation row:', status);
          
          if (status === 'Pending') {
            contextMenu = document.getElementById('approval-menu');
            menuHeight = 80;
            console.log('Showing approval menu for pending status (found by data-client)');
          } else if (status === 'Approved') {
            contextMenu = document.getElementById('approved-menu');
            menuHeight = 80;
            console.log('Showing approved menu for approved status (found by data-client)');
          } else if (status === 'Rejected') {
            contextMenu = document.getElementById('rejected-menu');
            menuHeight = 80;
            console.log('Showing rejected menu for rejected status (found by data-client)');
          }
        }
      } else {
        console.log('Operation row not found for client:', clientName);
        
        // Попробуем найти строку по имени в ячейке
        const allRows = document.querySelectorAll('.rb-row');
        console.log('Total rows found:', allRows.length);
        
        for (let row of allRows) {
          const nameCell = row.querySelector('.cell:nth-child(2)');
          if (nameCell && nameCell.textContent.trim() === clientName) {
            console.log('Found row by name cell:', row);
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
              const status = statusBadge.textContent.trim();
              console.log('Status from name cell search:', status);
              
              if (status === 'Pending') {
                contextMenu = document.getElementById('approval-menu');
                menuHeight = 80;
                console.log('Showing approval menu for pending status (found by name)');
              } else if (status === 'Approved') {
                contextMenu = document.getElementById('approved-menu');
                menuHeight = 80;
                console.log('Showing approved menu for approved status (found by name)');
              } else if (status === 'Rejected') {
                contextMenu = document.getElementById('rejected-menu');
                menuHeight = 80;
                console.log('Showing rejected menu for rejected status (found by name)');
              }
              break;
            }
          }
        }
      }
    }
  } else {
    console.log('Not in operations data mode, showing default menu');
  }
  
  // Если не нашли меню для операций, показываем стандартное меню
  if (!contextMenu) {
    contextMenu = document.getElementById('context-menu');
    menuHeight = 120; // высота меню для 3 пунктов
    console.log('Using default context menu');
  }
  
  if (!contextMenu) return;

  // Получаем границы контейнера таблицы
  const tableContainer = document.querySelector('.rb-panel');
  const containerRect = tableContainer ? tableContainer.getBoundingClientRect() : null;
  
  // Позиционируем меню относительно клика
  const buttonRect = event.target.getBoundingClientRect();
  const menuWidth = 200; // ширина меню из CSS
  
  let left = buttonRect.left + buttonRect.width / 2;
  let top = buttonRect.bottom + 8;
  
  // Проверяем границы контейнера и корректируем позицию
  if (containerRect) {
    // Проверяем правую границу
    if (left + menuWidth > containerRect.right) {
      left = containerRect.right - menuWidth - 8;
    }
    
    // Проверяем левую границу
    if (left < containerRect.left) {
      left = containerRect.left + 8;
    }
    
    // Проверяем нижнюю границу
    if (top + menuHeight > containerRect.bottom) {
      // Показываем меню выше кнопки
      top = buttonRect.top - menuHeight - 8;
    }
    
    // Проверяем верхнюю границу
    if (top < containerRect.top) {
      top = containerRect.top + 8;
    }
  }
  
  contextMenu.style.left = left + 'px';
  contextMenu.style.top = top + 'px';
  contextMenu.style.display = 'block';

  // Сохраняем данные клиента для использования в меню
  contextMenu.dataset.clientName = clientName;
  contextMenu.dataset.accountId = accountId;
  contextMenu.dataset.operationId = operationId;
  
  // Добавляем обработчик для скрытия меню при клике вне его (только если не активен)
  if (!contextMenuHandlerActive) {
    setTimeout(() => {
      document.addEventListener('click', hideContextMenu);
      contextMenuHandlerActive = true;
      console.log('Обработчик закрытия меню добавлен');
    }, 0);
  }
  
  console.log('=== ДАННЫЕ СОХРАНЕНЫ В КОНТЕКСТНОЕ МЕНЮ ===');
  console.log('Client name:', clientName);
  console.log('Account ID:', accountId);
}

// Функция для скрытия контекстного меню
function hideContextMenu(event) {
  // Список всех контекстных меню
  const menuIds = ['context-menu', 'approval-menu', 'approved-menu', 'rejected-menu'];
  
  menuIds.forEach(menuId => {
    const menu = document.getElementById(menuId);
    if (menu && menu.style.display !== 'none') {
      // Проверяем, что клик не по самому меню
      if (!menu.contains(event.target)) {
        menu.style.display = 'none';
        console.log(`Скрыто меню: ${menuId}`);
      }
    }
  });
  
  // Удаляем обработчик только если все меню скрыты
  const anyMenuVisible = menuIds.some(menuId => {
    const menu = document.getElementById(menuId);
    return menu && menu.style.display !== 'none';
  });
  
  if (!anyMenuVisible) {
    // Удаляем обработчик и сбрасываем флаг
    document.removeEventListener('click', hideContextMenu);
    contextMenuHandlerActive = false;
    console.log('Обработчик закрытия меню удален');
  }
}

// Инициализация контекстного меню
function initContextMenu() {
  console.log('=== ИНИЦИАЛИЗАЦИЯ КОНТЕКСТНОГО МЕНЮ ===');
  const contextMenu = document.getElementById('context-menu');
  if (!contextMenu) {
    console.error('Контекстное меню не найдено!');
    return;
  }
  console.log('Контекстное меню найдено:', contextMenu);

  // Обработчики для пунктов меню
  contextMenu.addEventListener('click', (e) => {
    console.log('=== КЛИК ПО КОНТЕКСТНОМУ МЕНЮ ===');
    console.log('Event target:', e.target);
    
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) {
      console.log('Клик не по пункту меню');
      return;
    }
    console.log('Найден пункт меню:', menuItem);

      const action = menuItem.dataset.action;
      const clientName = contextMenu.dataset.clientName;
      const accountId = contextMenu.dataset.accountId;
      const operationId = contextMenu.dataset.operationId;

      console.log('Данные из меню:', { action, clientName, accountId, operationId });
      
      // Скрываем меню
      contextMenu.style.display = 'none';
      // Удаляем обработчик закрытия меню и сбрасываем флаг
      document.removeEventListener('click', hideContextMenu);
      contextMenuHandlerActive = false;

      // Выполняем действие
      handleContextMenuAction(action, clientName, accountId, operationId);
  });
  
  // Добавляем обработчик для меню операций
  const approvalMenu = document.getElementById('approval-menu');
  if (approvalMenu) {
    console.log('Меню операций найдено:', approvalMenu);
    
    approvalMenu.addEventListener('click', (e) => {
      console.log('=== КЛИК ПО МЕНЮ ОПЕРАЦИЙ ===');
      console.log('Event target:', e.target);
      
      const menuItem = e.target.closest('.context-menu-item');
      if (!menuItem) {
        console.log('Клик не по пункту меню');
        return;
      }
      console.log('Найден пункт меню:', menuItem);

      const action = menuItem.dataset.action;
      const clientName = approvalMenu.dataset.clientName;
      const accountId = approvalMenu.dataset.accountId;
      const operationId = approvalMenu.dataset.operationId;

      console.log('Данные из меню:', { action, clientName, accountId, operationId });
      
      // Скрываем меню
      approvalMenu.style.display = 'none';
      // Удаляем обработчик закрытия меню и сбрасываем флаг
      document.removeEventListener('click', hideContextMenu);
      contextMenuHandlerActive = false;
      
      // Выполняем действие
      handleContextMenuAction(action, clientName, accountId, operationId);
    });
    
    console.log('Обработчики меню операций установлены');
  }
  
  // Добавляем обработчик для меню аппрувленных операций
  const approvedMenu = document.getElementById('approved-menu');
  if (approvedMenu) {
    console.log('Меню аппрувленных операций найдено:', approvedMenu);
    
    approvedMenu.addEventListener('click', (e) => {
      console.log('=== КЛИК ПО МЕНЮ АППРУВЛЕННЫХ ОПЕРАЦИЙ ===');
      console.log('Event target:', e.target);
      
      const menuItem = e.target.closest('.context-menu-item');
      if (!menuItem) {
        console.log('Клик не по пункту меню');
        return;
      }
      console.log('Найден пункт меню:', menuItem);

      const action = menuItem.dataset.action;
      const clientName = approvedMenu.dataset.clientName;
      const accountId = approvedMenu.dataset.accountId;
      const operationId = approvedMenu.dataset.operationId;

      console.log('Данные из меню:', { action, clientName, accountId, operationId });
      
      // Скрываем меню
      approvedMenu.style.display = 'none';
      // Удаляем обработчик закрытия меню и сбрасываем флаг
      document.removeEventListener('click', hideContextMenu);
      contextMenuHandlerActive = false;
      
      // Выполняем действие
      handleContextMenuAction(action, clientName, accountId, operationId);
    });
    
    console.log('Обработчики меню аппрувленных операций установлены');
  }
  
  // Добавляем обработчик для меню зареджекченных операций
  const rejectedMenu = document.getElementById('rejected-menu');
  if (rejectedMenu) {
    console.log('Меню зареджекченных операций найдено:', rejectedMenu);
    
    rejectedMenu.addEventListener('click', (e) => {
      console.log('=== КЛИК ПО МЕНЮ ЗАРЕДЖЕКЧЕННЫХ ОПЕРАЦИЙ ===');
      console.log('Event target:', e.target);
      
      const menuItem = e.target.closest('.context-menu-item');
      if (!menuItem) {
        console.log('Клик не по пункту меню');
        return;
      }
      console.log('Найден пункт меню:', menuItem);

      const action = menuItem.dataset.action;
      const clientName = rejectedMenu.dataset.clientName;
      const accountId = rejectedMenu.dataset.accountId;
      const operationId = rejectedMenu.dataset.operationId;

      console.log('Данные из меню:', { action, clientName, accountId, operationId });
      
      // Скрываем меню
      rejectedMenu.style.display = 'none';
      // Удаляем обработчик закрытия меню и сбрасываем флаг
      document.removeEventListener('click', hideContextMenu);
      contextMenuHandlerActive = false;
      
      // Выполняем действие
      handleContextMenuAction(action, clientName, accountId, operationId);
    });
    
    console.log('Обработчики меню зареджекченных операций установлены');
  }
  
  console.log('Обработчики контекстного меню установлены');
}

// Обработка действий контекстного меню
function handleContextMenuAction(action, clientName, accountId, operationId) {
  console.log('=== ОБРАБОТКА ДЕЙСТВИЯ КОНТЕКСТНОГО МЕНЮ ===');
  console.log('Action:', action);
  console.log('Client name:', clientName);
  console.log('Account ID:', accountId);
  console.log('Operation ID:', operationId);
  
  switch (action) {
    case 'change-rebate-type':
      console.log('Открываем модальное окно для изменения типа ребейта');
      // Открываем модальное окно для изменения типа ребейта
      openRebateModal({ clientName, accountId });
      break;
      
    case 'view-client-operations':
      console.log('=== ПЕРЕКЛЮЧЕНИЕ НА ОПЕРАЦИИ КЛИЕНТА ===');
      console.log('Клиент:', clientName);
      console.log('Аккаунт:', accountId);
      
      // Сохраняем текущую сортировку (если есть)
      if (sortState && sortState.column) {
        originalSortState = { ...sortState };
        console.log('Сохранена сортировка:', originalSortState);
      }
      
      // Фильтруем операции по клиенту
      filterOperationsByClient(clientName);
      
      // Переключаемся на вкладку операций
      const operationsTab = document.querySelector('.tabs .tab[aria-selected="false"]');
      if (operationsTab) {
        console.log('Переключаемся на вкладку операций');
        operationsTab.click();
        
        // Заполняем поле поиска Client после переключения на вкладку операций
        setTimeout(() => {
          try {
            const operationsSearchInput = document.querySelector('#filters-operations input[placeholder="John or 12345600"]');
            if (operationsSearchInput) {
              operationsSearchInput.value = clientName;
              console.log('Заполнено поле поиска в операциях значением:', clientName);
              
              // Добавляем иконку крестика для очистки поля
              const searchContainer = operationsSearchInput.closest('.input');
              if (searchContainer) {
                // Добавляем кнопку очистки если её нет
                let clearBtn = searchContainer.querySelector('.clear-search');
                if (!clearBtn) {
                  clearBtn = document.createElement('button');
                  clearBtn.type = 'button';
                  clearBtn.className = 'clear-search';
                  clearBtn.innerHTML = '×';
                  searchContainer.style.position = 'relative';
                  searchContainer.appendChild(clearBtn);
                }
                
                // Показываем кнопку очистки
                clearBtn.style.display = 'block';
                
                // Обработчик для очистки поля
                clearBtn.addEventListener('click', () => {
                  operationsSearchInput.value = '';
                  clearBtn.style.display = 'none';
                  
                  // Сбрасываем фильтр операций
                  console.log('=== СБРОС ФИЛЬТРА ОПЕРАЦИЙ ПО КНОПКЕ ОЧИСТКИ ===');
                  resetFilter();
                  renderTable();
                });
              }
              
              // Добавляем обработчик для показа/скрытия кнопки очистки
              operationsSearchInput.addEventListener('input', () => {
                const clearBtn = searchContainer.querySelector('.clear-search');
                if (clearBtn) {
                  clearBtn.style.display = operationsSearchInput.value ? 'block' : 'none';
                }
              });
              
              // Триггерим событие input для активации поиска
              operationsSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              console.log('Поле поиска в операциях не найдено');
            }
            
            // Переинициализируем select all после переключения на операции
            console.log('Переинициализируем select all после переключения на операции...');
            initializeSelectAll();
            syncSelectAllState();
          } catch (error) {
            console.error('Ошибка при обработке переключения на операции:', error);
          }
        }, 100); // Небольшая задержка для завершения переключения вкладки
      } else {
        console.log('Вкладка операций не найдена');
      }
      break;
      
    case 'suspend-rebate':
      // Приостанавливаем ребейт для клиента
      console.log(`Приостанавливаем ребейт для клиента: ${clientName}`);
      
      // Находим клиента в массиве rows и обновляем его данные
      const clientIndex = rows.findIndex(row => row.name === clientName);
      if (clientIndex !== -1) {
        // Сбрасываем данные ребейта
        rows[clientIndex].rebateType = null;
        rows[clientIndex].rebateTypeText = null;
        rows[clientIndex].percent = 0;
        rows[clientIndex].rebateSchedule = null;
        
        console.log('Данные клиента обновлены:', rows[clientIndex]);
        
        // Перерендериваем таблицу
        renderTable();
        
        console.log(`Ребейт приостановлен для клиента: ${clientName}`);
      } else {
        console.log('Клиент не найден в массиве rows');
      }
      break;
      
    case 'approve-operation':
      console.log('=== АППРУВ ОПЕРАЦИИ ===');
      console.log('Клиент:', clientName);
      console.log('Аккаунт:', accountId);
      console.log('ID операции:', operationId);
      
      // Находим операцию по ID или по имени клиента (fallback)
      let operationToApprove;
      
      // Определяем, в каком массиве искать - в отфильтрованных или во всех операциях
      const searchArray = isFilteredMode ? filteredOperations : rowsOperations;
      console.log('Поиск в массиве:', isFilteredMode ? 'filteredOperations' : 'rowsOperations', 'количество:', searchArray.length);
      
      if (operationId && operationId !== 'null' && operationId !== '') {
        operationToApprove = searchArray.find(op => op.id === operationId);
        console.log('Поиск по ID операции:', operationId, 'найдено:', !!operationToApprove);
        if (operationToApprove) {
          console.log('Найденная операция:', operationToApprove);
        }
      } else {
        console.log('ID операции недействителен:', operationId);
      }
      
      if (!operationToApprove) {
        operationToApprove = searchArray.find(op => op.name === clientName);
        console.log('Fallback поиск по имени клиента:', clientName, 'найдено:', !!operationToApprove);
      }
      
      if (operationToApprove) {
        operationToApprove.status = 'Approved';
        console.log('Status операции изменен на "Approved"');
        
        // Если мы в фильтрованном режиме, также обновляем оригинальную операцию в rowsOperations
        if (isFilteredMode && operationToApprove.id) {
          const originalOperation = rowsOperations.find(op => op.id === operationToApprove.id);
          if (originalOperation) {
            originalOperation.status = 'Approved';
            console.log('Синхронизирован статус в rowsOperations');
          }
        }
        
        // Перерисовываем таблицу
        renderTable();
        console.log('Таблица обновлена');
      } else {
        console.log('Операция не найдена для обновления');
      }
      break;
      
    case 'reject-operation':
      console.log('=== РЕДЖЕКТ ОПЕРАЦИИ ===');
      console.log('Клиент:', clientName);
      console.log('Аккаунт:', accountId);
      console.log('ID операции:', operationId);
      
      // Находим операцию по ID или по имени клиента (fallback)
      let operationToReject;
      
      // Определяем, в каком массиве искать - в отфильтрованных или во всех операциях
      const searchArrayReject = isFilteredMode ? filteredOperations : rowsOperations;
      console.log('Поиск в массиве:', isFilteredMode ? 'filteredOperations' : 'rowsOperations', 'количество:', searchArrayReject.length);
      
      if (operationId) {
        operationToReject = searchArrayReject.find(op => op.id === operationId);
        console.log('Поиск по ID операции:', operationId, 'найдено:', !!operationToReject);
      }
      
      if (!operationToReject) {
        operationToReject = searchArrayReject.find(op => op.name === clientName);
        console.log('Fallback поиск по имени клиента:', clientName, 'найдено:', !!operationToReject);
      }
      
      if (operationToReject) {
        operationToReject.status = 'Rejected';
        console.log('Status операции изменен на "Rejected"');
        
        // Если мы в фильтрованном режиме, также обновляем оригинальную операцию в rowsOperations
        if (isFilteredMode && operationToReject.id) {
          const originalOperation = rowsOperations.find(op => op.id === operationToReject.id);
          if (originalOperation) {
            originalOperation.status = 'Rejected';
            console.log('Синхронизирован статус в rowsOperations');
          }
        }
        
        // Перерисовываем таблицу
        renderTable();
        console.log('Таблица обновлена');
      } else {
        console.log('Операция не найдена для обновления');
      }
      break;
      
    case 'move-to-pending':
      console.log('=== ПЕРЕВОД В ОЖИДАНИЕ ===');
      console.log('Клиент:', clientName);
      console.log('Аккаунт:', accountId);
      console.log('ID операции:', operationId);
      
      // Находим операцию по ID или по имени клиента (fallback)
      let operationToMove;
      
      // Определяем, в каком массиве искать - в отфильтрованных или во всех операциях
      const searchArrayMove = isFilteredMode ? filteredOperations : rowsOperations;
      console.log('Поиск в массиве:', isFilteredMode ? 'filteredOperations' : 'rowsOperations', 'количество:', searchArrayMove.length);
      
      if (operationId) {
        operationToMove = searchArrayMove.find(op => op.id === operationId);
        console.log('Поиск по ID операции:', operationId, 'найдено:', !!operationToMove);
      }
      
      if (!operationToMove) {
        operationToMove = searchArrayMove.find(op => op.name === clientName);
        console.log('Fallback поиск по имени клиента:', clientName, 'найдено:', !!operationToMove);
      }
      
      if (operationToMove) {
        operationToMove.status = 'Pending';
        console.log('Status операции изменен на "Pending"');
        
        // Если мы в фильтрованном режиме, также обновляем оригинальную операцию в rowsOperations
        if (isFilteredMode && operationToMove.id) {
          const originalOperation = rowsOperations.find(op => op.id === operationToMove.id);
          if (originalOperation) {
            originalOperation.status = 'Pending';
            console.log('Синхронизирован статус в rowsOperations');
          }
        }
        
        // Перерисовываем таблицу
        renderTable();
        console.log('Таблица обновлена');
      } else {
        console.log('Операция не найдена для обновления');
      }
      break;
      
    default:
      console.log('Unknown action:', action);
  }
}

// Функция для стилизации ячеек таблицы
function highlightTableCells(clientName) {
  console.log('=== Стилизация ячеек таблицы ===');
  console.log('Клиент:', clientName);
  
  setTimeout(() => {
    // Находим строку по имени клиента
    const allRows = document.querySelectorAll('#clients-body .rb-row');
    console.log('Найдено строк в таблице:', allRows.length);
    let targetRow = null;
    
    for (let row of allRows) {
      const nameCell = row.querySelector('.cell:nth-child(2)');
      const rowName = nameCell ? nameCell.textContent.trim() : '';
      console.log('Проверяем строку с именем:', rowName);
      
      // Ищем точное совпадение
      if (nameCell && rowName === clientName) {
        targetRow = row;
        console.log('Найдена целевая строка по точному совпадению!');
        break;
      }
      
      // Если точное совпадение не найдено, ищем по частичному совпадению
      if (!targetRow && nameCell) {
        const rowNameLower = rowName.toLowerCase();
        const clientNameLower = clientName.toLowerCase();
        if (rowNameLower.includes(clientNameLower) || clientNameLower.includes(rowNameLower)) {
          targetRow = row;
          console.log('Найдена целевая строка по частичному совпадению!');
          break;
        }
      }
    }
    
    if (targetRow) {
      // Находим ячейки типа выплаты и процента
      const typeCell = targetRow.querySelector('.cell:nth-child(5)'); // Approval type
      const percentCell = targetRow.querySelector('.cell:nth-child(6)'); // Процент ребейта
      
      console.log('typeCell найден:', typeCell);
      console.log('percentCell найден:', percentCell);
      
      if (typeCell) {
        // Убираем класс muted и добавляем cell-updated
        typeCell.classList.remove('muted');
        typeCell.classList.add('cell-updated');
        console.log('Стили добавлены к ячейке типа выплаты');
        console.log('Классы ячейки типа:', typeCell.className);
      }
      
      if (percentCell) {
        // Убираем класс muted и добавляем cell-updated
        percentCell.classList.remove('muted');
        percentCell.classList.add('cell-updated');
        console.log('Стили добавлены к ячейке процента');
        console.log('Классы ячейки процента:', percentCell.className);
      }
    } else {
      console.log('Строка для стилизации не найдена');
    }
  }, 100);
}

// Функция для обновления таблицы с данными ребейта
function updateTableWithRebateData(selectedType, timeValue, percentValue) {
  console.log('=== Обновление таблицы с данными ребейта ===');
  console.log('Тип:', selectedType, 'Время:', timeValue, 'Процент:', percentValue);
  
  // Используем глобальную переменную для определения текущего клиента
  const clientName = currentModalClient;
  
  console.log('=== ПРОВЕРКА ДЛЯ АВТО-РЕЖИМОВ ===');
  console.log('selectedType:', selectedType);
  console.log('selectedType.includes("Auto"):', selectedType.includes('Auto'));
  console.log('currentModalClient:', currentModalClient);
  console.log('clientName:', clientName);
  
  if (!clientName) {
    console.log('Имя клиента не найдено в глобальной переменной currentModalClient');
    return;
  }
  
  console.log('Клиент:', clientName);
  console.log('Доступные имена в массиве rows:', rows.map(r => r.name));
  console.log('Полный массив rows:', rows);
  console.log('=== ДЕТАЛЬНАЯ ПРОВЕРКА ПОИСКА ===');
  console.log('Ищем клиента:', `"${clientName}"`);
  console.log('Длина имени клиента:', clientName.length);
  console.log('Тип имени клиента:', typeof clientName);
  
  // Улучшенный поиск клиента - сначала точное совпадение, затем частичное
  let rowIndex = -1;
  
  // 1. Точное совпадение
  rowIndex = rows.findIndex(row => row.name === clientName);
  console.log('Поиск точного совпадения для:', clientName, 'результат:', rowIndex);
  
  // 2. Если не найдено, ищем по частичному совпадению (более строгое)
  if (rowIndex === -1) {
    console.log('Точное совпадение не найдено, ищем по частичному совпадению...');
    rowIndex = rows.findIndex(row => {
      const rowName = row.name.toLowerCase().trim();
      const clientNameLower = clientName.toLowerCase().trim();
      
      // Проверяем, что одно имя содержит другое (более строгая проверка)
      const matches = (rowName.includes(clientNameLower) && clientNameLower.length >= 3) || 
                     (clientNameLower.includes(rowName) && rowName.length >= 3);
      
      console.log('Сравниваем:', `"${rowName}"` + ' с ' + `"${clientNameLower}"`, 'результат:', matches);
      return matches;
    });
    console.log('Поиск по частичному совпадению, результат:', rowIndex);
  }
  
  // 3. Если все еще не найдено, попробуем найти по кнопке, которая открыла модальное окно
  if (rowIndex === -1) {
    console.log('Поиск по кнопке, которая открыла модальное окно...');
    // Находим активную кнопку "Set Rebate" (если есть способ это отследить)
    const activeButton = document.querySelector('.rebate-setup-btn[data-client="' + clientName + '"]');
    if (activeButton) {
      const buttonClientName = activeButton.getAttribute('data-client');
      const buttonAccount = activeButton.getAttribute('data-account');
      console.log('Найдена кнопка для клиента:', buttonClientName, 'аккаунт:', buttonAccount);
      
      // Ищем по комбинации имени и аккаунта
      rowIndex = rows.findIndex(row => 
        row.name === buttonClientName && row.account === buttonAccount
      );
      console.log('Поиск по кнопке, результат:', rowIndex);
    }
  }
  
  console.log('Финальный индекс строки в массиве:', rowIndex);
  
  if (rowIndex !== -1) {
    console.log('Обновляем данные для строки:', rows[rowIndex]);
    console.log('Проверяем соответствие клиента: ожидаем', clientName, 'получили', rows[rowIndex].name);
    
    // Дополнительная проверка, что мы обновляем правильного клиента
    if (rows[rowIndex].name !== clientName) {
      console.error('ОШИБКА: Попытка обновить данные для неправильного клиента!');
      console.error('Ожидаемый клиент:', clientName);
      console.error('Найденный клиент:', rows[rowIndex].name);
      return;
    }
    
    console.log('Данные ДО обновления:', {
      name: rows[rowIndex].name,
      percent: rows[rowIndex].percent,
      rebateType: rows[rowIndex].rebateType,
      rebateTypeText: rows[rowIndex].rebateTypeText,
      rebateSchedule: rows[rowIndex].rebateSchedule
    });
    
    // Обновляем процент
    rows[rowIndex].percent = parseFloat(percentValue.replace('%', ''));
    console.log('Процент обновлен:', rows[rowIndex].percent);
    
    // Обновляем тип выплаты
    if (selectedType === 'Manual') {
      rows[rowIndex].rebateType = 'manual';
      rows[rowIndex].rebateTypeText = 'Manual';
      rows[rowIndex].rebateSchedule = null;
      console.log('Тип установлен: Manual');
    } else if (selectedType.includes('Auto')) {
      rows[rowIndex].rebateType = 'auto';
      rows[rowIndex].rebateTypeText = 'Auto';
      rows[rowIndex].rebateSchedule = timeValue;
      console.log('Тип установлен: Auto, расписание:', timeValue);
    } else {
      console.log('НЕИЗВЕСТНЫЙ ТИП:', selectedType);
      console.log('Проверяем contains Auto:', selectedType.includes('Auto'));
    }
    
    console.log('Данные ПОСЛЕ обновления:', {
      name: rows[rowIndex].name,
      percent: rows[rowIndex].percent,
      rebateType: rows[rowIndex].rebateType,
      rebateTypeText: rows[rowIndex].rebateTypeText,
      rebateSchedule: rows[rowIndex].rebateSchedule
    });
    console.log('Данные обновлены в массиве:', rows[rowIndex]);
  } else {
    console.log('Строка с именем', clientName, 'не найдена в массиве rows');
    console.log('Доступные имена:', rows.map(r => r.name));
    console.log('Доступные аккаунты:', rows.map(r => r.account));
    
    // Попробуем создать новую запись, если клиент не найден
    console.log('Попытка создать новую запись для клиента:', clientName);
    const newRow = {
      name: clientName,
      account: '00000000', // Значение по умолчанию
      profit: 0,
      percent: parseFloat(percentValue.replace('%', '')),
      paid: 0,
      rebateType: selectedType === 'Manual' ? 'manual' : 'auto',
      rebateTypeText: selectedType === 'Manual' ? 'Manual' : 'Auto',
      rebateSchedule: selectedType.includes('Auto') ? timeValue : null
    };
    
    rows.push(newRow);
    console.log('Добавлена новая строка:', newRow);
    rowIndex = rows.length - 1;
  }
  
  // Перегенерируем операции на основе обновленных данных клиентов
  console.log('Перегенерируем операции на основе обновленных данных клиентов...');
  generateOperationsFromClients();
  
  // Синхронизируем процент ребейта с операциями
  console.log('Синхронизируем процент ребейта с операциями...');
  syncRebatePercent();
  
  // Синхронизируем тип выплаты с операциями
  console.log('Синхронизируем тип выплаты с операциями...');
  syncRebateType();
  
  // Обновляем статусы операций на основе типа выплаты
  console.log('Обновляем статусы операций на основе типа выплаты...');
  updateOperationStatuses();
  
  // Перерисовываем таблицу
  console.log('Перерисовываем таблицу...');
  renderTable();
  
  // Добавляем стили к обновленным ячейкам
  highlightTableCells(clientName);
  
  console.log('=== Обновление таблицы завершено ===');
}

// Функция для сброса полей при изменении типа выплаты
function resetRebateFields() {
  console.log('=== Сброс полей ребейта ===');
  
  // Сбрасываем поле времени в зависимости от текущего типа
  const typeSelect = document.getElementById('rbm-type');
  const selectedType = typeSelect?.querySelector('.select-value')?.textContent;
  console.log('Текущий тип выплаты для сброса:', selectedType);
  
  const timeField = document.getElementById('rbm-time');
  if (timeField) {
    // Устанавливаем значение по умолчанию в зависимости от типа
    if (selectedType === 'Auto daily') {
      timeField.value = 'Every day 09:00';
      timeField.placeholder = '';
    } else if (selectedType === 'Auto weekly') {
      timeField.value = 'Every Monday 09:00';
      timeField.placeholder = '';
    } else if (selectedType === 'Auto monthly') {
      timeField.value = 'Every 1st of the month 09:00';
      timeField.placeholder = '';
    } else {
      timeField.value = 'Every day 09:00'; // Default fallback
      timeField.placeholder = '';
    }
    console.log('Поле времени сброшено для типа:', selectedType, 'Placeholder:', timeField.placeholder);
  }
  
  // Сбрасываем процент ребейта
  const percentInput = document.getElementById('rbm-percent');
  if (percentInput) {
    const input = percentInput.querySelector('input');
    if (input) {
      input.value = '50%';
      console.log('Процент ребейта сброшен');
    }
  }
  
  // Сбрасываем чипы дней недели
  const weekChips = document.querySelector('.week-chips');
  if (weekChips) {
    // Убираем активный класс у всех чипсов
    weekChips.querySelectorAll('.chip').forEach(chip => {
      chip.classList.remove('is-active');
      chip.setAttribute('aria-selected', 'false');
    });
    
    // Устанавливаем понедельник как активный по умолчанию
    const mondayChip = weekChips.querySelector('[data-wd="mon"]');
    if (mondayChip) {
      mondayChip.classList.add('is-active');
      mondayChip.setAttribute('aria-selected', 'true');
      weekChips.dataset.selectedWd = 'mon';
    }
    console.log('Чипы дней недели сброшены');
  }
  
  // Сбрасываем информационный текст
  const noteText = document.getElementById('rb-note-text');
  if (noteText) {
    // Получаем текущее имя клиента из модального окна
    const currentClientName = document.querySelector('#rbm-client').textContent;
    noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${currentClientName}</span>'s future trades require manual confirmation<br>in <b>Trade Payout Approval</b>.`;
    console.log('Информационный текст сброшен');
  }
  
  // Очищаем календарь из DOM если он есть
  const timePop = document.getElementById('tp-dropdown');
  if (timePop) {
    // Удаляем календарь из DOM
    timePop.innerHTML = '';
    timePop.style.display = 'none';
    console.log('Календарь очищен из DOM');
  }
  
  // Сбрасываем подсказку о времени
  const timeHint = document.getElementById('rbm-time-hint');
  if (timeHint) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = tomorrow.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[tomorrow.getMonth()];
    const year = tomorrow.getFullYear();
    timeHint.textContent = `Next automatic payout ${day} ${month} ${year} at 09:00`;
    console.log('Подсказка о времени сброшена');
  }
  
  console.log('=== Сброс полей завершен ===');
}

// Функция для добавления обработчиков кликов к чипам дней недели
function addWeekChipsClickHandlers(weekChipsContainer) {
  console.log('=== addWeekChipsClickHandlers called ===');
  console.log('Container:', weekChipsContainer);
  console.log('Container display:', weekChipsContainer.style.display);
  
  const chips = weekChipsContainer.querySelectorAll('.chip');
  console.log('Found', chips.length, 'chips to add listeners to');
  
  if (chips.length === 0) {
    console.log('No chips found!');
    return;
  }
  
  chips.forEach((chip, index) => {
    console.log(`Adding listener to chip ${index}:`, chip.dataset.wd, chip.textContent.trim());
    
    // Удаляем старые обработчики, если они есть
    chip.removeEventListener('click', handleChipClick);
    
    // Добавляем новый обработчик
    chip.addEventListener('click', handleChipClick);
    console.log(`Listener added to chip ${index}`);
  });
  
  console.log('=== addWeekChipsClickHandlers finished ===');
}

// Обработчик клика по чипу
function handleChipClick(e) {
  console.log('=== CHIP CLICKED ===');
  console.log('Clicked chip:', this);
  console.log('Clicked chip dataset.wd:', this.dataset.wd);
  console.log('Event target:', e.target);
  
  // Выводим информацию о том, на какую кнопку был сделан клик
  const dayName = this.textContent.trim();
  const dayCode = this.dataset.wd;
  console.log(`Клик по кнопке: "${dayName}" (код: ${dayCode})`);
  
  e.preventDefault();
  e.stopPropagation();
  
  // Находим контейнер чипов
  const weekChipsContainer = this.closest('.week-chips');
  if (!weekChipsContainer) {
    console.log('Week chips container not found');
    return;
  }
  
  // Убираем активный класс у всех чипсов
  weekChipsContainer.querySelectorAll('.chip').forEach(chip => {
    chip.classList.remove('is-active');
    chip.setAttribute('aria-selected', 'false');
  });
  
  // Добавляем активный класс к кликнутому чипу
  this.classList.add('is-active');
  this.setAttribute('aria-selected', 'true');
  
  // Сохраняем выбранный день
  weekChipsContainer.dataset.selectedWd = this.dataset.wd;
  
  console.log(`Активный чип изменен на: ${dayName} (${dayCode})`);
  
  // Обновляем поле периода, если функция доступна
  if (window.updatePeriodField) {
    window.updatePeriodField();
  }
}

function createRow({ name, account, profit, percent, paid, rebateType, rebateTypeText, rebateSchedule, operationType, status, date, id }) {
  console.log('=== СОЗДАНИЕ СТРОКИ ===');
  console.log('Name:', name);
  console.log('ID:', id);
  console.log('Operation type:', operationType);
  
  const row = document.createElement('div');
  row.className = 'rb-row rb-grid';
  
  // Определяем тип данных по наличию дополнительных полей
  const isOperationsData = operationType !== undefined;
  
  // Определяем, нужно ли добавлять класс muted к ячейкам
  const hasRebateType = rebateType && (rebateType === 'manual' || rebateType === 'auto');
  const hasPercent = percent && percent > 0;
  const isConfigured = hasRebateType || hasPercent;
  
  // Классы для ячеек типа выплаты и процента
  const typeCellClass = isConfigured ? 'cell' : 'cell muted';
  const percentCellClass = isConfigured ? 'cell cell--num' : 'cell cell--num muted';
  
  // Определяем содержимое ячейки "Approval type" в зависимости от типа данных
  let typeCellContent = '';
  if (isOperationsData) {
    typeCellContent = operationType;
  } else {
    typeCellContent = getRebateTypeDisplay(name);
  }
  
  // Создаем HTML в зависимости от типа данных
  if (isOperationsData) {
    // Для операций - 10 колонок (с колонкой статуса и группы)
    row.innerHTML = `
      <div class="cell cell--chk">
        <input type="checkbox">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="checkbox-icon">
          <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="rgba(0, 0, 0, 0.15)" stroke-width="1" fill="none"/>
          <path class="checkmark" d="M3.33203 8.66699L5.9987 11.3337L12.6654 4.66699" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="cell">${name}</div>
      <div class="cell">
        <span class="account-number">${account}</span>
        <button type="button" class="js-account-info" data-tooltip="${getAccountTooltip(account)}" aria-label="Инфо">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.25">
              <path d="M8.66667 10.6667H8V8H7.33333M8 5.33333H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>
        </button>
      </div>
      <div class="cell" style="opacity: 0.5;">No group</div>
      <div class="cell cell--num">${profit} USD</div>
      <div class="${typeCellClass}">
        ${typeCellContent}
        ${typeCellContent === 'Auto' ? `
          <span class="js-auto-info" style="display: inline-block; margin-left: 4px;" data-tooltip="Automatic transaction payout will occur on Sep 23, 2025 at 9:00" aria-label="Info">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer;">
              <g opacity="0.25">
                <path d="M8.66667 10.6667H8V8H7.33333M8 5.33333H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
            </svg>
          </span>
        ` : ''}
      </div>
      <div class="${percentCellClass}">${getPercentDisplay(percent)}</div>
      <div class="cell cell--num">${getPaidDisplay(paid)}</div>
      <div class="cell" data-column="status"><span class="status-badge ${status === 'Approved' ? 'approved' : ''} ${status === 'Rejected' ? 'rejected' : ''}">${status || 'Ждет аппрув'}</span></div>
      <div class="cell cell--action"><button class="${getButtonClass(rebateType, percent)}" data-client="${name}" data-account="${account}" data-operation-id="${id || ''}">${getButtonText(rebateType, percent)}</button></div>
    `;
  } else {
    // Для клиентов - 8 колонок (без колонки статуса)
    row.innerHTML = `
      <div class="cell cell--chk">
        <input type="checkbox">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="checkbox-icon">
          <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="rgba(0, 0, 0, 0.15)" stroke-width="1" fill="none"/>
          <path class="checkmark" d="M3.33203 8.66699L5.9987 11.3337L12.6654 4.66699" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="cell">${name}</div>
      <div class="cell">
        <span class="account-number">${account}</span>
        <button type="button" class="js-account-info" data-tooltip="${getAccountTooltip(account)}" aria-label="Инфо">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.25">
              <path d="M8.66667 10.6667H8V8H7.33333M8 5.33333H8.00667M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
          </svg>
        </button>
      </div>
      <div class="cell cell--num">${profit} USD</div>
      <div class="${typeCellClass}">${typeCellContent}</div>
      <div class="${percentCellClass}">${getPercentDisplay(percent)}</div>
      <div class="cell cell--num">${getPaidDisplay(paid)}</div>
      <div class="cell cell--action"><button class="${getButtonClass(rebateType, percent)}" data-client="${name}" data-account="${account}" data-operation-id="${id || ''}">${getButtonText(rebateType, percent)}</button></div>
    `;
  }
  
  console.log('Строка создана с ID кнопки:', id || 'undefined');
  return row;
}

const body = document.getElementById('clients-body');

function renderTable() {
  console.log('=== renderTable вызвана ===');
  console.log('Данные rows для отрисовки:', rows.map(r => ({
    name: r.name,
    percent: r.percent,
    rebateType: r.rebateType,
    rebateTypeText: r.rebateTypeText
  })));
  body.innerHTML = '';
  rows.forEach((r) => body.appendChild(createRow(r)));
  console.log('=== renderTable завершена ===');
  
  // Переинициализируем select-all после рендеринга таблицы
  setTimeout(() => {
    initializeSelectAll();
    syncSelectAllState();
  }, 50);
}

renderTable();
updateFooter();

// Sorting
const getCellValue = (row, key) => row[key];
let sortState = { key: null, dir: 1 };

function sortBy(key) {
  if (sortState.key === key) {
    sortState.dir *= -1;
  } else {
    sortState = { key, dir: 1 };
  }
  rows = [...rows].sort((a, b) => {
    let av, bv;
    
    // Специальная обработка для колонки "Trading account" - сортировка по дате начала торговли
    if (key === 'account') {
      av = getTradingStartDate(a.account);
      bv = getTradingStartDate(b.account);
    } else {
      av = getCellValue(a, key);
      bv = getCellValue(b, key);
    }
    
    if (av === bv) return 0;
    return av > bv ? sortState.dir : -sortState.dir;
  });
  updateSortIndicators();
  renderTable();
}

function updateSortIndicators() {
  document.querySelectorAll('.rb-panel .cell--sortable').forEach((th) => {
    const key = th.getAttribute('data-sort');
    th.dataset.sorted = sortState.key === key ? (sortState.dir === 1 ? 'asc' : 'desc') : '';
  });
}

document.querySelectorAll('.rb-panel .cell--sortable').forEach((th) => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => sortBy(th.getAttribute('data-sort')));
});

// Select all checkbox - перемещено в DOMContentLoaded

// Row checkbox highlight toggle - используем делегирование событий на document
// чтобы обработчик работал даже после перерисовки таблицы
document.addEventListener('change', (e) => {
  if (e.target && e.target.type === 'checkbox') {
    console.log('=== CHECKBOX CHANGE EVENT ===');
    console.log('Checkbox checked:', e.target.checked);
    console.log('Current rows:', rows);
    console.log('rows === rowsOperations:', rows === rowsOperations);
    console.log('rows === filteredOperations:', rows === filteredOperations);
    
    const row = e.target.closest('.rb-row');
    const cell = e.target.closest('.cell--chk');
    if (row && cell) {
      row.classList.toggle('row-selected', e.target.checked);
      cell.classList.toggle('checked', e.target.checked);
    }
    
    // Обновляем футер при изменении чекбоксов с небольшой задержкой
    setTimeout(() => {
      updateFooter();
    }, 10);
    
    // Синхронизируем состояние select-all
    syncSelectAllState();
  }
});



// Tooltip toggle
document.addEventListener('DOMContentLoaded', function() {
  const tooltipTrigger = document.getElementById('title-tooltip-trigger');
  const infoTooltip = document.getElementById('info-tooltip');

  console.log('Tooltip trigger:', tooltipTrigger);
  console.log('Info tooltip:', infoTooltip);

  function toggleTooltip(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle tooltip clicked');
    console.log('Current classes:', infoTooltip.className);
    infoTooltip.classList.toggle('show');
    console.log('After toggle classes:', infoTooltip.className);
  }

  if (tooltipTrigger && infoTooltip) {
    tooltipTrigger.addEventListener('click', toggleTooltip);
    console.log('Event listener added');
  } else {
    console.log('Elements not found!');
  }

  // Close tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (infoTooltip && !infoTooltip.contains(e.target) && e.target !== tooltipTrigger) {
      infoTooltip.classList.remove('show');
    }
  });
});

// ===== Row tooltip (isolated, inline styles, no CSS changes) =====
const tableBody = document.getElementById('clients-body');

let rowTipEl = null;
let rowTipAnchor = null; // текущая иконка

function ensureRowTipEl() {
  console.log('ensureRowTipEl called, rowTipEl exists:', !!rowTipEl);
  if (rowTipEl) return rowTipEl;
  console.log('Creating new tooltip element');
  const el = document.createElement('div');
  el.id = 'rb-row-tip';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'fixed';
  el.style.minWidth = 'auto';
  el.style.maxWidth = '360px';
  el.style.width = 'auto';
  el.style.padding = '12px 16px';
  el.style.background = '#fff';
  el.style.color = '#000';
  el.style.borderRadius = '12px';
  el.style.boxSizing = 'border-box';
  el.style.filter = 'drop-shadow(0px 4px 16px rgba(0,0,0,0.15))';
  el.style.zIndex = '2147483647'; // поверх всего
  el.style.display = 'none';
  el.style.pointerEvents = 'auto';
  el.style.lineHeight = '1.4';
  // стрелка (псевдоэлемента нет, рисуем inline)
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.top = '-8px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '8px solid transparent';
  arrow.style.borderRight = '8px solid transparent';
  arrow.style.borderBottom = '8px solid #fff';
  arrow.style.filter = 'drop-shadow(0px 2px 4px rgba(0,0,0,0.12))';
  arrow.dataset.part = 'arrow';
  const content = document.createElement('div');
  content.dataset.part = 'content';
  content.style.fontSize = '14px';
  el.appendChild(arrow);
  el.appendChild(content);
  document.body.appendChild(el);
  rowTipEl = el;
  console.log('Tooltip element created and added to DOM:', el);
  return el;
}

function hideRowTip() {
  if (!rowTipEl) return;
  rowTipEl.style.display = 'none';
  rowTipEl.setAttribute('aria-hidden', 'true');
  rowTipEl.querySelector('[data-part="content"]').textContent = '';
  rowTipAnchor = null;
}

function showRowTip(anchorBtn, text) {
  console.log('showRowTip called with:', anchorBtn, text);
  const el = ensureRowTipEl();
  console.log('Tooltip element:', el);

  // toggle на ту же иконку
  if (rowTipAnchor === anchorBtn) {
    hideRowTip();
    return;
  }
  rowTipAnchor = anchorBtn;

  // заполняем
  el.querySelector('[data-part="content"]').innerHTML = (text || 'Информация недоступна').replace(/\n/g, '<br>');
  el.style.display = 'block';
  el.style.minWidth = 'auto'; // Ensure minWidth is always maintained
  el.setAttribute('aria-hidden', 'false');
  console.log('Tooltip shown with text:', text);
  console.log('Tooltip display after setting:', el.style.display);
  console.log('Tooltip aria-hidden after setting:', el.getAttribute('aria-hidden'));

  // позиционируем
  const r = anchorBtn.getBoundingClientRect();
  const gap = 8;
  const w = el.offsetWidth;       // реальная ширина
  const h = el.offsetHeight;      // реальная высота (auto)
  const iconCenterX = r.left + r.width / 2;

  let left = Math.round(iconCenterX - w / 2);
  let top  = Math.round(r.bottom + gap);

  // не уезжать за края
  const pad = 8;
  if (left < pad) left = pad;
  if (left + w > window.innerWidth - pad) left = window.innerWidth - w - pad;

  el.style.left = left + 'px';
  el.style.top  = top + 'px';

  // центрируем стрелку относительно иконки
  const arrow = el.querySelector('[data-part="arrow"]');
  const arrowX = Math.round(iconCenterX - left);
  arrow.style.left = arrowX + 'px';
  arrow.style.transform = 'translateX(-50%)';
  
  // Final enforcement of minWidth after positioning
  el.style.minWidth = 'auto';
  
  console.log('Tooltip final state - display:', el.style.display, 'aria-hidden:', el.getAttribute('aria-hidden'));
}

// Функция для генерации случайной даты между 16 июня 2024 и текущей датой
function generateRandomDate() {
  const startDate = new Date('2024-06-16');
  const currentDate = new Date();
  const randomTime = startDate.getTime() + Math.random() * (currentDate.getTime() - startDate.getTime());
  const randomDate = new Date(randomTime);
  
  // Форматируем дату в нужном формате
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return randomDate.toLocaleDateString('en-US', options);
}

// Тестируем функцию генерации случайных дат
console.log('Testing random date generation:');
for (let i = 0; i < 5; i++) {
  console.log(`Random date ${i + 1}:`, generateRandomDate());
}

// Делегирование клика по иконкам информации - используем делегирование событий на document
// чтобы обработчик работал даже после перерисовки таблицы
document.addEventListener('click', (e) => {
  console.log('Click event on:', e.target);
  console.log('Click event classList:', e.target.classList);
  console.log('Click event parentElement:', e.target.parentElement);
  
  const btn = e.target.closest('.js-account-info') || e.target.closest('.rebate-info-icon') || e.target.closest('.js-auto-info');
  console.log('Found button:', btn);
  
  if (!btn) return;
  e.stopPropagation();
  
  // Проверяем, находимся ли мы на странице "Trade Payout Approval"
  const operationsTab = document.querySelector('.tabs .tab[aria-selected="true"]');
  const isOperationsMode = operationsTab && operationsTab.textContent.trim() === 'Trade Payout Approval';
  
  let text;
  if (isOperationsMode && btn.classList.contains('js-account-info')) {
    // Для страницы операций генерируем случайную дату закрытия аккаунта
    const randomDate = generateRandomDate();
    
    // Извлекаем тип аккаунта из существующего tooltip (например, "OctaTrader", "MT5")
    const originalTooltip = btn.getAttribute('data-tooltip') || '';
    let accountType = 'account';
    
    // Ищем тип аккаунта в тексте tooltip
    if (originalTooltip.includes('OctaTrader')) {
      accountType = 'OctaTrader';
    } else if (originalTooltip.includes('MT5')) {
      accountType = 'MT5';
    } else if (originalTooltip.includes('Trading from')) {
      // Извлекаем тип аккаунта из текста "Trading from [TYPE] account"
      const match = originalTooltip.match(/Trading from (\w+) account/);
      if (match && match[1]) {
        accountType = match[1];
      }
    }
    
    text = `Trade from ${accountType} account was closed<br>on ${randomDate}`;
  } else {
    // Для других случаев используем стандартный текст из data-tooltip
    text = btn.getAttribute('data-tooltip');
  }
  
  console.log('Tooltip clicked:', btn, 'text:', text);
  showRowTip(btn, text);
});

// Закрытие при клике вне
document.addEventListener('click', (e) => {
  if (!rowTipEl || rowTipEl.style.display === 'none') return;
  const insideTip = e.target.closest('#rb-row-tip');
  const onIcon    = e.target.closest('.js-account-info') || e.target.closest('.rebate-info-icon') || e.target.closest('.js-auto-info');
  if (!insideTip && !onIcon) hideRowTip();
}, false);

// Закрытие при прокрутке/ресайзе
window.addEventListener('scroll', hideRowTip, { passive: true });
window.addEventListener('resize', hideRowTip);

// ===== end row tooltip =====

// Делаем функцию showRowTip доступной глобально
window.showRowTip = showRowTip;

// ===== Search functionality =====
// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  // Функция для инициализации поиска для конкретного поля
  function initSearchForInput(searchInput) {
    if (!searchInput) return;
    
    console.log('Initializing search for input:', searchInput.placeholder);

    function filterTable(searchTerm) {
      const rows = document.querySelectorAll('#clients-body .rb-row');
      const term = searchTerm.toLowerCase().trim();
      
      console.log('Search term:', term);
      console.log('Found rows:', rows.length);
      
      rows.forEach((row, index) => {
        const nameCell = row.querySelector('.cell:nth-child(2)'); // Client (2-я колонка)
        const accountCell = row.querySelector('.cell:nth-child(3) .account-number'); // Номер аккаунта (3-я колонка)
        
        const nameText = nameCell ? nameCell.textContent.toLowerCase() : '';
        const accountText = accountCell ? accountCell.textContent.toLowerCase() : '';
        
        console.log(`Row ${index}: name="${nameText}", account="${accountText}"`);
        
        const matches = term === '' || nameText.includes(term) || accountText.includes(term);
        
        row.style.display = matches ? 'grid' : 'none';
        console.log(`Row ${index}: matches=${matches}, display=${row.style.display}`);
      });
    }

    // Обработчик поиска
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value;
      console.log('Input event triggered, search term:', searchTerm);
      filterTable(searchTerm);
    });
    console.log('Search event listener added for:', searchInput.placeholder);

    // Очистка поиска при клике на крестик (если есть)
    const searchContainer = searchInput.closest('.input');
    if (searchContainer) {
      // Добавляем кнопку очистки если её нет
      let clearBtn = searchContainer.querySelector('.clear-search');
      if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-search';
        clearBtn.innerHTML = '×';
        // Стили теперь в CSS
        searchContainer.style.position = 'relative';
        searchContainer.appendChild(clearBtn);
      }
      
      // Показываем/скрываем кнопку очистки
      searchInput.addEventListener('input', () => {
        clearBtn.style.display = searchInput.value ? 'block' : 'none';
      });
      
      // Очистка поиска
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        filterTable('');
        
        // Если мы во вкладке операций, сбрасываем фильтр и показываем все операции
        const operationsTab = document.querySelector('.tabs .tab[aria-selected="true"]');
        if (operationsTab && operationsTab.textContent.trim() === 'Trade Payout Approval') {
          console.log('=== СБРОС ФИЛЬТРА ОПЕРАЦИЙ ПО КНОПКЕ ОЧИСТКИ ===');
          
          // Сбрасываем фильтр
          resetFilter();
          
          // Переключаемся на полный список операций
          rows = rowsOperations;
          isOperationsData = true;
          
          // Обновляем заголовок таблицы для операций
          updateTableHeader();
          
          // Обновляем таблицу
          renderTable();
          updateFooter();
          
          console.log('Показаны все операции после очистки поиска');
        }
      });
    }
  }

  // Инициализируем поиск для всех полей "ID или торговый аккаунт"
  const searchInputs = document.querySelectorAll('input[placeholder*="John"]');
  console.log('Found search inputs:', searchInputs.length);
  
  searchInputs.forEach((input, index) => {
    console.log(`Initializing search input ${index}:`, input.placeholder);
    initSearchForInput(input);
  });
  
  // Если не нашли поля по placeholder, ищем по структуре
  if (searchInputs.length === 0) {
    console.log('No search inputs found by placeholder, searching by structure...');
    const allInputs = document.querySelectorAll('.filter .input input');
    console.log('Found filter inputs:', allInputs.length);
    
    allInputs.forEach((input, index) => {
      console.log(`Filter input ${index}:`, input.placeholder, input);
      initSearchForInput(input);
    });
  }
});

// ===== end search functionality =====

// ===== Rebate Modal =====
// Глобальная переменная для отслеживания состояния обработчиков
let contextMenuHandlerActive = false;

document.addEventListener('DOMContentLoaded', function() {
  const clientsBody = document.getElementById('clients-body');
  const modal = document.getElementById('rebate-modal');
  const dialog = modal?.querySelector('.rb-modal__dialog');
  const titleEl = modal?.querySelector('#rbm-title');
  const clientSpan = modal?.querySelector('#rbm-client');
  const percentInput = modal?.querySelector('#rbm-percent input');
  const typeSelect = modal?.querySelector('#rbm-type');
  const submitBtn = modal?.querySelector('#rbm-submit');

  let lastActiveEl = null;

  console.log('Modal elements found:', { clientsBody, modal, dialog, titleEl, clientSpan, percentInput, typeSelect, submitBtn });
  
  if (!submitBtn) {
    console.error('Кнопка "Confirm" не найдена!');
    // Попробуем найти кнопку другими способами
    const allButtons = document.querySelectorAll('button');
    console.log('Все кнопки на странице:', allButtons);
    const confirmButtons = document.querySelectorAll('button[type="button"]');
    console.log('Кнопки type="button":', confirmButtons);
  } else {
    console.log('Кнопка "Confirm" найдена:', submitBtn);
    console.log('Текст кнопки:', submitBtn.textContent);
    console.log('ID кнопки:', submitBtn.id);
  }

  // хук на кнопки "Set Rebate" - используем делегирование событий на document
  // чтобы обработчик работал даже после перерисовки таблицы
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.rebate-setup-btn');
    if (!btn) return;

    console.log('Rebate button clicked:', btn);
    const clientName = btn.getAttribute('data-client') || 'клиента';
    const accountId  = btn.getAttribute('data-account') || '';

    // Проверяем, есть ли у кнопки класс no-border (значит это кнопка с тремя точками)
    if (btn.classList.contains('no-border')) {
      showContextMenu(e, clientName, accountId);
    } else {
      openRebateModal({ clientName, accountId });
    }
  });

  // Обработчики для кнопок массовых операций в футере
  document.addEventListener('click', (e) => {
    // Кнопка "Approve payout"
    if (e.target.id === 'approve-selected-btn') {
      console.log('Approve selected button clicked');
      handleBulkApprove();
    }
    
    // Кнопка "Reject payouts"
    if (e.target.id === 'reject-selected-btn') {
      console.log('Reject selected button clicked');
      handleBulkReject();
    }
    
    // Кнопка "Set pending"
    if (e.target.id === 'set-pending-btn') {
      console.log('Set pending button clicked');
      handleBulkSetPending();
    }
  });

  // Обработчик кнопки "Confirm"
  function handleSubmitClick(e) {
    console.log('=== КНОПКА ПОДТВЕРДИТЬ НАЖАТА ===');
    console.log('Event:', e);
    
    const raw = (percentInput.value || '').trim();
    const num = parseFloat(raw.replace('%',''));
    if (Number.isNaN(num) || num < 0 || num > 100) {
      console.log('Ошибка валидации процента:', raw);
      percentInput.focus();
      percentInput.select();
      return;
    }
    
    // Получаем данные из модального окна
    const selectedType = typeSelect.querySelector('.select-value').textContent;
    const timeField = document.getElementById('rbm-time');
    const timeValue = timeField ? timeField.value : '';
    const percentValue = raw;
    
    console.log('Данные из модального окна:', {
      selectedType,
      timeValue,
      percentValue
    });
    
    // Обновляем данные в таблице
    console.log('Вызываем updateTableWithRebateData...');
    updateTableWithRebateData(selectedType, timeValue, percentValue);
    
    const payload = {
      type: typeSelect.value,   // 'manual' | 'auto'
      percent: num / 100        // 0..1
    };
    console.log('Rebate settings submitted:', payload);

    closeRebateModal();
  }

  // Функция для обновления текста с ближайшей выплатой
  function updateNextPayoutText() {
    console.log('=== updateNextPayoutText called ===');
    const timeHint = document.getElementById('rbm-time-hint');
    if (!timeHint) {
      console.log('timeHint element not found');
      return;
    }
    
    // Получаем выбранный тип выплаты
    const typeSelect = document.getElementById('rbm-type');
    const selectedType = typeSelect?.querySelector('.select-value')?.textContent;
    console.log('selectedType:', selectedType);
    
    // Получаем время из поля ввода
    const timeField = document.getElementById('rbm-time');
    let time = '09:00'; // значение по умолчанию
    
    if (timeField && timeField.value) {
      // Извлекаем время из различных форматов
      const timeMatch = timeField.value.match(/(\d{2}:\d{2})/);
      if (timeMatch) {
        time = timeMatch[1];
      }
    }
    console.log('timeField:', timeField, 'time:', time);
    
    let nextPayoutDate;
    
    if (selectedType === 'Auto daily') {
      // Для ежедневных выплат - завтра
      nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 1);
    } else if (selectedType === 'Auto weekly') {
      // Для еженедельных выплат - следующий выбранный день недели
      const weekChips = document.querySelector('.week-chips');
      const selectedDay = weekChips?.dataset.selectedWd || 'mon';
      
      // Маппинг дней недели
      const dayMap = {
        'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 
        'fri': 5, 'sat': 6, 'sun': 0
      };
      
      const targetDay = dayMap[selectedDay];
      nextPayoutDate = new Date();
      
      // Находим следующий день недели
      const currentDay = nextPayoutDate.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7;
      
      if (daysUntilTarget === 0) {
        // Если сегодня тот же день, берем следующий
        nextPayoutDate.setDate(nextPayoutDate.getDate() + 7);
      } else {
        nextPayoutDate.setDate(nextPayoutDate.getDate() + daysUntilTarget);
      }
    } else if (selectedType === 'Auto monthly') {
      // Для ежемесячных выплат - следующий выбранный день месяца
      const calendarDays = document.querySelectorAll('.calendar-day.selected');
      let selectedDay = 1; // по умолчанию 1 число
      
      if (calendarDays.length > 0) {
        selectedDay = parseInt(calendarDays[0].dataset.day) || 1;
      }
      
      nextPayoutDate = new Date();
      nextPayoutDate.setDate(selectedDay);
      
      // Если выбранный день уже прошел в этом месяце, берем следующий месяц
      if (nextPayoutDate < new Date()) {
        nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1);
        nextPayoutDate.setDate(selectedDay);
      }
    } else {
      // Для ручных выплат или неизвестного типа - завтра
      nextPayoutDate = new Date();
      nextPayoutDate.setDate(nextPayoutDate.getDate() + 1);
    }
    
    // Форматируем дату
    const day = nextPayoutDate.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[nextPayoutDate.getMonth()];
    const year = nextPayoutDate.getFullYear();
    
    const newText = `Next automatic payout ${day} ${month} ${year} at ${time}`;
    console.log('Setting timeHint text to:', newText);
    timeHint.textContent = newText;
  }
  
  // Делаем функцию доступной глобально для отладки
  window.updateNextPayoutText = updateNextPayoutText;

  function openRebateModal({ clientName, accountId }) {
    console.log('=== ВЫЗОВ openRebateModal ===');
    console.log('Modal element:', modal);
    console.log('Modal exists:', !!modal);
    
    if (!modal) {
      console.error('Модальное окно не найдено!');
      return;
    }

    console.log('=== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ===');
    console.log('Opening modal for:', { clientName, accountId });
    console.log('Тип clientName:', typeof clientName);
    console.log('Длина clientName:', clientName.length);
    console.log('clientName charCodeAt(0):', clientName.charCodeAt(0));
    
    // Сохраняем текущего клиента в глобальной переменной
    currentModalClient = clientName;
    console.log('Текущий клиент в модальном окне установлен:', currentModalClient);

    // Проверяем, есть ли уже данные для этого клиента
    const existingRow = rows.find(r => r.name === clientName);
    console.log('Существующие данные для клиента:', existingRow);
    
    if (existingRow) {
      console.log('Найдены существующие данные:', {
        rebateType: existingRow.rebateType,
        rebateTypeText: existingRow.rebateTypeText,
        percent: existingRow.percent,
        rebateSchedule: existingRow.rebateSchedule
      });
    }

    // динамические тексты
    titleEl.textContent = `Set Rebate Sharing for ${clientName}`;
    clientSpan.textContent = clientName;
    
    console.log('Имя клиента в модальном окне установлено:', clientName);
    console.log('clientSpan.textContent после установки:', clientSpan.textContent);

    // значения по умолчанию или существующие данные
    if (existingRow && existingRow.rebateType) {
      // Предзаполняем модальное окно существующими данными
      console.log('Предзаполняем модальное окно существующими данными');
      
      // Устанавливаем тип выплаты
      if (existingRow.rebateType === 'manual') {
        typeSelect.querySelector('.select-value').textContent = 'Manual';
        typeSelect.dataset.value = 'manual';
      } else if (existingRow.rebateType === 'auto') {
        typeSelect.querySelector('.select-value').textContent = 'Auto daily';
        typeSelect.dataset.value = 'auto-daily';
      }
      
      // Устанавливаем процент
      if (existingRow.percent) {
        percentInput.value = `${existingRow.percent}%`;
      } else {
        percentInput.value = '50%';
      }
      
      // Устанавливаем время для авто-режима
      if (existingRow.rebateSchedule) {
        const timeField = document.getElementById('rbm-time');
        if (timeField) {
          timeField.value = existingRow.rebateSchedule;
        }
      }
    } else {
      // Значения по умолчанию для нового клиента
      typeSelect.value = 'manual';
      percentInput.value = '50%';
    }

    // обновляем текст с ближайшей выплатой
    const timeHint = document.getElementById('rbm-time-hint');
    if (timeHint) {
      // Добавляем небольшую задержку, чтобы элементы успели инициализироваться
      setTimeout(() => {
        updateNextPayoutText();
      }, 100);
    }

    // показать модалку
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
    lastActiveEl = document.activeElement;

    // блокируем скролл страницы
    document.documentElement.style.overflow = 'hidden';

    // фокус внутрь
    dialog.focus();

    // фокус-трап
    trapFocus(dialog);
    
    // Добавляем обработчик кнопки "Confirm" после открытия модального окна
    const submitBtnInModal = modal.querySelector('#rbm-submit');
    if (submitBtnInModal) {
      console.log('Кнопка "Confirm" найдена в модальном окне:', submitBtnInModal);
      // Удаляем старый обработчик если есть
      submitBtnInModal.removeEventListener('click', handleSubmitClick);
      // Добавляем новый обработчик
      submitBtnInModal.addEventListener('click', handleSubmitClick);
    } else {
      console.error('Кнопка "Confirm" не найдена в модальном окне!');
    }
  }

  function closeRebateModal() {
    if (!modal) return;
    
    // Очищаем глобальную переменную текущего клиента
    currentModalClient = null;
    console.log('Модальное окно закрыто, currentModalClient очищен');
    
    // Сначала убираем фокус с активного элемента
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    
    // Затем скрываем модальное окно
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = ''; // вернуть скролл
    
    // Возвращаем фокус на предыдущий элемент
    if (lastActiveEl && lastActiveEl.focus) {
      // Небольшая задержка, чтобы убедиться, что модальное окно полностью скрыто
      setTimeout(() => {
        lastActiveEl.focus();
      }, 0);
    }
  }

  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeRebateModal(); }
  });
  document.addEventListener('keydown', (e) => {
    if (modal.style.display !== 'block') return;
    if (e.key === 'Escape') closeRebateModal();
  });

  // упрощённая валидация процента
  percentInput?.addEventListener('input', () => {
    const v = (percentInput.value || '').replace(/[^\d.,%]/g,'').replace(',', '.');
    percentInput.value = v;
  });

  // сабмит (старый обработчик - больше не используется)
  /*
  submitBtn?.addEventListener('click', (e) => {
    const raw = (percentInput.value || '').trim();
    const num = parseFloat(raw.replace('%',''));
    if (Number.isNaN(num) || num < 0 || num > 100) {
      console.log('Ошибка валидации процента:', raw);
      percentInput.focus();
      percentInput.select();
      return;
    }
    
    // Получаем данные из модального окна
    const selectedType = typeSelect.querySelector('.select-value').textContent;
    const timeField = document.getElementById('rbm-time');
    const timeValue = timeField ? timeField.value : '';
    const percentValue = raw;
    
    console.log('Данные из модального окна:', {
      selectedType,
      timeValue,
      percentValue
    });
    
    // Обновляем данные в таблице
    console.log('Вызываем updateTableWithRebateData...');
    updateTableWithRebateData(selectedType, timeValue, percentValue);
    
    const payload = {
      type: typeSelect.value,   // 'manual' | 'auto'
      percent: num / 100        // 0..1
      // сюда можно добавить clientId/accountId при необходимости
    };
    console.log('Rebate settings submitted:', payload);

    closeRebateModal();
  });
  */

  // фокус-трап внутри диалога
  function trapFocus(container) {
    const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    let nodes = Array.from(container.querySelectorAll(FOCUSABLE));
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];

    function onKey(e) {
      if (e.key !== 'Tab') return;
      nodes = Array.from(container.querySelectorAll(FOCUSABLE));
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
  }
});

// ===== end rebate modal =====

// Функции для массовых операций
function handleBulkApprove() {
  console.log('=== МАССОВОЕ АПРУВЛЕНИЕ ===');
  
  // Получаем выбранные строки
  const activeContainer = document.querySelector('#clients-body') || document.querySelector('#operations-body');
  const checkedBoxes = activeContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  console.log('Выбранных операций для апрува:', checkedBoxes.length);
  
  // Обновляем статус выбранных операций
  checkedBoxes.forEach((checkbox, index) => {
    const row = checkbox.closest('.rb-row');
    if (row) {
      // Находим элемент статуса в строке
      const statusElement = row.querySelector('.status-badge');
      if (statusElement) {
        statusElement.textContent = 'Approved';
        statusElement.className = 'status-badge approved';
        console.log(`Операция ${index + 1} апрувлена`);
      }
    }
  });
  
  // Обновляем футер
  updateFooter();
  
  console.log('Массовое апрувление завершено');
}

function handleBulkReject() {
  console.log('=== МАССОВОЕ РЕДЖЕКТИРОВАНИЕ ===');
  
  // Получаем выбранные строки
  const activeContainer = document.querySelector('#clients-body') || document.querySelector('#operations-body');
  const checkedBoxes = activeContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  console.log('Выбранных операций для реджекта:', checkedBoxes.length);
  
  // Обновляем статус выбранных операций
  checkedBoxes.forEach((checkbox, index) => {
    const row = checkbox.closest('.rb-row');
    if (row) {
      // Находим элемент статуса в строке
      const statusElement = row.querySelector('.status-badge');
      if (statusElement) {
        statusElement.textContent = 'Rejected';
        statusElement.className = 'status-badge rejected';
        console.log(`Операция ${index + 1} зареджекчена`);
      }
    }
  });
  
  // Обновляем футер
  updateFooter();
  
  console.log('Массовое реджектирование завершено');
}

function handleBulkSetPending() {
  console.log('=== МАССОВОЕ УСТАНОВЛЕНИЕ PENDING ===');
  
  // Получаем выбранные строки
  const activeContainer = document.querySelector('#clients-body') || document.querySelector('#operations-body');
  const checkedBoxes = activeContainer.querySelectorAll('input[type="checkbox"]:checked');
  
  console.log('Выбранных операций для установки pending:', checkedBoxes.length);
  
  // Обновляем статус выбранных операций
  checkedBoxes.forEach((checkbox, index) => {
    const row = checkbox.closest('.rb-row');
    if (row) {
      // Находим элемент статуса в строке
      const statusElement = row.querySelector('.status-badge');
      if (statusElement) {
        statusElement.textContent = 'Pending';
        statusElement.className = 'status-badge pending';
        console.log(`Операция ${index + 1} установлена в pending`);
      }
    }
  });
  
  // Обновляем футер
  updateFooter();
  
  console.log('Массовое установление pending завершено');
}

// Выносим функции модального окна в глобальную область видимости
function openRebateModal({ clientName, accountId }) {
  console.log('=== ВЫЗОВ openRebateModal ===');
  console.log('Modal element:', modal);
  console.log('Modal exists:', !!modal);
  
  if (!modal) {
    console.error('Модальное окно не найдено!');
    return;
  }

  console.log('=== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ===');
  console.log('Opening modal for:', { clientName, accountId });
  console.log('Тип clientName:', typeof clientName);
  console.log('Длина clientName:', clientName.length);
  console.log('clientName charCodeAt(0):', clientName.charCodeAt(0));
  
  // Сохраняем текущего клиента в глобальной переменной
  currentModalClient = clientName;
  console.log('Текущий клиент в модальном окне установлен:', currentModalClient);

  // Проверяем, есть ли уже данные для этого клиента
  const existingRow = rows.find(r => r.name === clientName);
  console.log('Существующие данные для клиента:', existingRow);
  
  if (existingRow) {
    console.log('Найдены существующие данные:', {
      rebateType: existingRow.rebateType,
      rebateTypeText: existingRow.rebateTypeText,
      percent: existingRow.percent,
      rebateSchedule: existingRow.rebateSchedule
    });
  }

  // динамические тексты
  const titleEl = modal.querySelector('#rbm-title');
  const clientSpan = modal.querySelector('#rbm-client');
  if (titleEl) titleEl.textContent = `Set Rebate Sharing for ${clientName}`;
  if (clientSpan) clientSpan.textContent = clientName;
  
  console.log('Имя клиента в модальном окне установлено:', clientName);
  console.log('clientSpan.textContent после установки:', clientSpan ? clientSpan.textContent : 'clientSpan не найден');

  // значения по умолчанию или существующие данные
  const typeSelect = modal.querySelector('#rbm-type');
  const percentInput = modal.querySelector('#rbm-time');
  
  if (existingRow && existingRow.rebateType) {
    // Предзаполняем модальное окно существующими данными
    console.log('Предзаполняем модальное окно существующими данными');
    
    // Устанавливаем тип выплаты
    if (existingRow.rebateType === 'manual') {
      if (typeSelect) {
        typeSelect.querySelector('.select-value').textContent = 'Manual';
        typeSelect.dataset.value = 'manual';
      }
    } else if (existingRow.rebateType === 'auto') {
      if (typeSelect) {
        typeSelect.querySelector('.select-value').textContent = 'Auto daily';
        typeSelect.dataset.value = 'auto-daily';
      }
    }
    
    // Устанавливаем процент
    if (existingRow.percent && percentInput) {
      percentInput.value = `${existingRow.percent}%`;
    } else if (percentInput) {
      percentInput.value = '50%';
    }
    
    // Устанавливаем время для авто-режима
    if (existingRow.rebateSchedule) {
      const timeField = modal.querySelector('#rbm-time');
      if (timeField) {
        timeField.value = existingRow.rebateSchedule;
      }
    }
  } else {
    // Значения по умолчанию для нового клиента
    if (typeSelect) typeSelect.value = 'manual';
    if (percentInput) percentInput.value = '50%';
  }

  // обновляем текст с ближайшей выплатой
  const timeHint = modal.querySelector('#rbm-time-hint');
  if (timeHint) {
    // Получаем завтрашнюю дату
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Форматируем дату как "17 Сен 2025"
    const day = tomorrow.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[tomorrow.getMonth()];
    const year = tomorrow.getFullYear();
    
    timeHint.textContent = `Next automatic payout ${day} ${month} ${year} at 09:00`;
  }

  // показать модалку
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  const lastActiveEl = document.activeElement;

  // блокируем скролл страницы
  document.documentElement.style.overflow = 'hidden';

  // фокус внутрь
  const dialog = modal.querySelector('.rb-modal__dialog');
  if (dialog) dialog.focus();

  // фокус-трап
  trapFocus(dialog);
  
  // Добавляем обработчик кнопки "Confirm" после открытия модального окна
  const submitBtnInModal = modal.querySelector('#rbm-submit');
  if (submitBtnInModal) {
    console.log('Кнопка "Confirm" найдена в модальном окне:', submitBtnInModal);
    // Удаляем старый обработчик если есть
    submitBtnInModal.removeEventListener('click', handleSubmitClick);
    // Добавляем новый обработчик
    submitBtnInModal.addEventListener('click', handleSubmitClick);
  } else {
    console.error('Кнопка "Confirm" не найдена в модальном окне!');
  }
}

function closeRebateModal() {
  if (!modal) return;
  
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  
  // восстанавливаем скролл страницы
  document.documentElement.style.overflow = '';
  
  // возвращаем фокус
  if (lastActiveEl) {
    lastActiveEl.focus();
  }
  
  // Очищаем глобальную переменную
  currentModalClient = null;
  
  // Переинициализируем select-all после закрытия модального окна
  setTimeout(() => {
    console.log('Reinitializing select-all after modal close');
    initializeSelectAll();
    syncSelectAllState();
  }, 100);
}

// ===== Dropdown functionality =====
document.addEventListener('DOMContentLoaded', function() {
  const selectType = document.getElementById('rbm-type');
  const dropdownMenu = document.getElementById('rbm-type-dropdown');
  const selectValue = document.querySelector('.select-value');
  const dropdownOptions = document.querySelectorAll('.dropdown-option');

  if (!selectType || !dropdownMenu || !selectValue) return;

  let isOpen = false;

  // Toggle dropdown
  selectType.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close time picker if it's open
    const timePop = document.getElementById('tp-dropdown');
    if (timePop) {
      timePop.style.display = 'none';
      timePop.classList.remove('active');
      console.log('Таймпикер закрыт при клике на селект типа выплаты');
    }
    
    isOpen = !isOpen;
    dropdownMenu.style.display = isOpen ? 'block' : 'none';
    
    // Rotate chevron
    const chevron = selectType.querySelector('.chev svg');
    if (chevron) {
      chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  });

  // Select option
  dropdownOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const value = option.dataset.value;
      const text = option.textContent;
      
      // Сбрасываем только процент ребейта и чипы при изменении опции
      // Поле времени будет установлено в зависимости от выбранной опции
      const percentInput = document.getElementById('rbm-percent');
      if (percentInput) {
        const input = percentInput.querySelector('input');
        if (input) {
          input.value = '50%';
        }
      }
      
      // Close time picker if it's open
      const timePop = document.getElementById('tp-dropdown');
      if (timePop) {
        timePop.style.display = 'none';
        timePop.classList.remove('active');
        console.log('Таймпикер закрыт при выборе опции:', value);
      }
      
      // Update selected value
      selectValue.textContent = text;
      
      // Вызываем функцию сброса полей ребейта ПОСЛЕ обновления текста
      resetRebateFields();
      
      // Update selected state
      dropdownOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      // Show/hide period field based on selection
      const periodField = document.getElementById('period-field');
      const noteText = document.getElementById('rb-note-text');
      if (value === 'auto-daily') {
        periodField.style.display = 'block';
        // Apply margin to label
        const periodLabel = periodField.querySelector('.rb-label');
        if (periodLabel) {
          periodLabel.style.marginBottom = '6px';
        }
        // Hide week chips for daily mode
        const weekChips = document.querySelector('.week-chips');
        if (weekChips) {
          weekChips.style.display = 'none';
        }
        
        // Устанавливаем правильное значение поля времени для ежедневного режима
        const timeField = document.getElementById('rbm-time');
        if (timeField) {
          timeField.value = 'Every day 09:00';
          timeField.placeholder = '';
          console.log('Поле времени установлено для ежедневного режима');
        }
        
        // Стилизуем ячейки таблицы при выборе "Auto daily"
        // УБРАНО: стилизация теперь происходит только при подтверждении
        /*
        const clientSpan = document.querySelector('#rbm-client');
        console.log('clientSpan найден:', clientSpan);
        if (clientSpan) {
          const clientName = clientSpan.textContent.trim();
          console.log('Стилизация ячеек для ежедневного режима, клиент:', clientName);
          console.log('Вызываем highlightTableCells...');
          highlightTableCells(clientName);
        } else {
          console.log('clientSpan не найден!');
        }
        */
        
        // Update note text for automatic mode
        const clientName = document.querySelector('#rbm-client').textContent;
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically every day at 9:00. You can cancel automatic payouts in <b>Trade Payout Approval</b>.`;
        
        // Close the dropdown when opening time picker
        isOpen = false;
        dropdownMenu.style.display = 'none';
        const chevron = selectType.querySelector('.chev svg');
        if (chevron) {
          chevron.style.transform = 'rotate(0deg)';
        }
      } else if (value === 'auto-weekly') {
        periodField.style.display = 'block';
        // Apply margin to label
        const periodLabel = periodField.querySelector('.rb-label');
        if (periodLabel) {
          periodLabel.style.marginBottom = '6px';
        }
        // Show week chips for weekly mode
        const weekChips = document.querySelector('.week-chips');
        console.log('Weekly mode selected - weekChips:', weekChips);
        if (weekChips) {
          weekChips.style.display = 'flex';
          console.log('Week chips displayed');
          
          // Устанавливаем правильное значение поля времени для еженедельного режима
          const timeField = document.getElementById('rbm-time');
          if (timeField) {
            timeField.value = 'Every Monday 09:00';
            timeField.placeholder = '';
            console.log('Поле времени установлено для еженедельного режима');
          }
          
          // Стилизуем ячейки таблицы при выборе "Auto weekly"
          // УБРАНО: стилизация теперь происходит только при подтверждении
          /*
          const clientSpan = document.querySelector('#rbm-client');
          if (clientSpan) {
            const clientName = clientSpan.textContent.trim();
            console.log('Стилизация ячеек для еженедельного режима, клиент:', clientName);
            highlightTableCells(clientName);
          }
          */
          
          // Добавляем обработчики кликов для чипов
          addWeekChipsClickHandlers(weekChips);
          
          // Инициализируем чипсы после того, как они стали видимыми
          setTimeout(() => {
            const defaultChip = weekChips.querySelector('[data-wd="mon"]');
            if (defaultChip && !weekChips.dataset.selectedWd) {
              // Используем новую функцию для установки активного чипса
              if (window.setActiveChip) {
                window.setActiveChip(defaultChip);
              } else {
                // Fallback к старой логике
                weekChips.dataset.selectedWd = 'mon';
                defaultChip.classList.add('is-active');
                defaultChip.setAttribute('aria-selected', 'true');
                
                // Стили теперь управляются через CSS классы
                // Сбрасываем стили для остальных чипсов
                weekChips.querySelectorAll('.chip').forEach(c => {
                  if (c !== defaultChip) {
                    c.classList.remove('is-active');
                    c.setAttribute('aria-selected', 'false');
                  }
                });
              }
              
              console.log('Week chips initialized with Monday as default');
            }
          }, 100);
        } else {
          console.log('Week chips not found!');
        }
        // Update note text for weekly mode
        const clientName = document.querySelector('#rbm-client').textContent;
        const weekChipsElement = document.querySelector('.week-chips');
        const selectedDay = weekChipsElement?.dataset.selectedWd || 'mon';
        const dayName = window.WEEKDAY_NAMES[selectedDay] || 'Monday';
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically every week on ${dayName} at 9:00. You can reject automatic payouts in <b>Trade Payout Approval</b>.`;
        
        // Close the dropdown when opening time picker
        isOpen = false;
        dropdownMenu.style.display = 'none';
        const chevron = selectType.querySelector('.chev svg');
        if (chevron) {
          chevron.style.transform = 'rotate(0deg)';
        }
      } else if (value === 'auto-monthly') {
        periodField.style.display = 'block';
        // Apply margin to label
        const periodLabel = periodField.querySelector('.rb-label');
        if (periodLabel) {
          periodLabel.style.marginBottom = '6px';
        }
        // Hide week chips for monthly mode
        const weekChips = document.querySelector('.week-chips');
        if (weekChips) {
          weekChips.style.display = 'none';
        }
        
        // Устанавливаем правильное значение поля времени для месячного режима
        const timeField = document.getElementById('rbm-time');
        if (timeField) {
          timeField.value = 'Every 1st of the month 09:00';
          timeField.placeholder = '';
          console.log('Поле времени установлено для месячного режима');
        }
        
        // Стилизуем ячейки таблицы при выборе "Auto monthly"
        // УБРАНО: стилизация теперь происходит только при подтверждении
        /*
        const clientSpan = document.querySelector('#rbm-client');
        if (clientSpan) {
          const clientName = clientSpan.textContent.trim();
          console.log('Стилизация ячеек для месячного режима, клиент:', clientName);
          highlightTableCells(clientName);
        }
        */
        
        // Update note text for monthly mode
        const clientName = document.querySelector('#rbm-client').textContent;
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically on the 1st day of each month at 9:00. You can reject automatic payouts in <b>Trade Payout Approval</b>.`;
        
        // Close the dropdown when opening time picker
        isOpen = false;
        dropdownMenu.style.display = 'none';
        const chevron = selectType.querySelector('.chev svg');
        if (chevron) {
          chevron.style.transform = 'rotate(0deg)';
        }
      } else {
        periodField.style.display = 'none';
        // Hide week chips for manual and other modes
        const weekChips = document.querySelector('.week-chips');
        if (weekChips) {
          weekChips.style.display = 'none';
        }
        // Reset to manual mode text
        const currentClientName = document.querySelector('#rbm-client').textContent;
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${currentClientName}</span>'s future trades require manual confirmation<br>in <b>Trade Payout Approval</b>.`;
      }
      
      // Close dropdown
      isOpen = false;
      dropdownMenu.style.display = 'none';
      
      // Reset chevron
      const chevron = selectType.querySelector('.chev svg');
      if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
      }
      
      console.log('Selected:', value, text);
      console.log('Period field should be visible:', value === 'auto-daily');
      
      // Обновляем текст с ближайшей выплатой при изменении типа
      updateNextPayoutText();
    });
  });

  // Close dropdown when clicking outside (but not time picker)
  document.addEventListener('click', (e) => {
    const isTimePickerElement = e.target.closest('.rb-timepop') || e.target.closest('#rbm-period');
    const isSelectElement = selectType.contains(e.target) || dropdownMenu.contains(e.target);
    
    if (isOpen && !isSelectElement && !isTimePickerElement) {
      isOpen = false;
      dropdownMenu.style.display = 'none';
      
      // Reset chevron
      const chevron = selectType.querySelector('.chev svg');
      if (chevron) {
        chevron.style.transform = 'rotate(0deg)';
      }
    }
  });

  // Set initial selected state
  dropdownOptions[0].classList.add('selected');
});

// ===== end dropdown functionality =====

// ===== Time picker functionality =====
document.addEventListener('DOMContentLoaded', function() {
  const prefix = 'Every day ';
  const field = document.getElementById('rbm-time');
  const timeIcon = document.querySelector('.time-icon') || document.querySelector('.rb-time-icon');
  const dropdown = document.getElementById('tp-dropdown');
  
  if (!field || !dropdown) return;

  // Переменная для отслеживания формата времени
  let is12HourFormat = true;

  function ensurePrefix(val){ if (!val || !val.startsWith(prefix)) return prefix + (val||'').replace(prefix,''); return val; }
  field.value = ensurePrefix(field.value || prefix + '09:00');

  // защита префикса
  field.addEventListener('keydown', (e)=>{
    const pos = field.selectionStart || 0;
    if ((e.key === 'Backspace' && pos <= prefix.length) || (e.key === 'ArrowLeft' && pos <= prefix.length)){
      e.preventDefault();
      field.setSelectionRange(prefix.length, prefix.length);
    }
  });
  
  // маска HH:MM в правой части
  field.addEventListener('input', ()=>{
    if (!field.value.startsWith(prefix)) field.value = ensurePrefix(field.value);
    const right = field.value.slice(prefix.length);
    let v = right.replace(/[^0-9]/g,'').slice(0,4);
    if (v.length >= 3) v = v.slice(0,2)+':'+v.slice(2);
    const ok = /^\d{2}:\d{2}$/.test(v);
    const [h,m] = ok ? v.split(':').map(Number) : [0,0];
    const valid = ok && h>=0 && h<24 && m>=0 && m<60;
    field.value = prefix + (valid ? v : v);
  });
  
  field.addEventListener('focus', ()=> setTimeout(()=> field.setSelectionRange(prefix.length, field.value.length), 0));

  // Функции для работы с 12-часовым форматом
  function formatHour12(hour) {
    if (hour === 0) return 12;
    if (hour > 12) return hour - 12;
    return hour;
  }
  
  function getAMPM(hour) {
    return hour < 12 ? 'AM' : 'PM';
  }
  
  function parse12Hour(timeStr) {
    const [time, period] = timeStr.split(' ');
    const [hour, minute] = time.split(':').map(Number);
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) hour24 += 12;
    if (period === 'AM' && hour === 12) hour24 = 0;
    return { hour: hour24, minute };
  }
  
  function format12Hour(hour, minute) {
    const hour12 = formatHour12(hour);
    const period = getAMPM(hour);
    return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
  }

  // колёса
  function buildWheel(container, count, is12Hour = false){
    console.log(`buildWheel called: container=${container}, count=${count}, is12Hour=${is12Hour}`);
    if (!container) {
      console.log('buildWheel: container is null, returning');
      return;
    }
    
    const frag = document.createDocumentFragment();
    let itemsCount = 0;
    
       if (is12Hour) {
         // Для 12-часового формата: 1-12 (с индексами 0-11)
         for (let i=0;i<12;i++){ 
           const d=document.createElement('div'); 
           d.className='item'; 
           d.dataset.index=i; 
           d.textContent=String(i+1); // Отображаем 1-12, но индекс 0-11
           frag.appendChild(d); 
           itemsCount++;
         }
       } else {
         // Для 24-часового формата: 00-23
         for (let i=0;i<count;i++){ 
           const d=document.createElement('div'); 
           d.className='item'; 
           d.dataset.index=i; 
           d.textContent=String(i).padStart(2,'0'); 
           frag.appendChild(d); 
           itemsCount++;
         }
       }
    
    container.innerHTML=''; 
    container.appendChild(frag);
    
    console.log(`Built wheel with ${itemsCount} items, is12Hour: ${is12Hour}`);
    console.log(`Container height: ${container.clientHeight}px, scroll height: ${container.scrollHeight}px`);
    console.log(`Container innerHTML length: ${container.innerHTML.length}`);
  }
  
  function updateWheels() {
    console.log('updateWheels called, wheelH:', window.wheelH, 'wheelM:', window.wheelM, 'is12HourFormat:', is12HourFormat);
    if (window.wheelH && window.wheelM) {
      console.log('Building wheels...');
      buildWheel(window.wheelH, 24, is12HourFormat);
      buildWheel(window.wheelM, 60);
      
      // Добавляем отступы сверху и снизу для правильной прокрутки
      setTimeout(() => {
        addPaddingToWheels();
      }, 100);
    } else {
      console.log('Wheels not found, cannot update');
    }
  }
  
  function addPaddingToWheels() {
    [window.wheelH, window.wheelM].forEach(wheel => {
      // Добавляем пустые элементы сверху и снизу для центрирования
      const topPadding = document.createElement('div');
      topPadding.className = 'item';
      topPadding.style.height = '110px'; // Половина высоты контейнера
      topPadding.style.visibility = 'hidden';
      
      const bottomPadding = document.createElement('div');
      bottomPadding.className = 'item';
      bottomPadding.style.height = '110px';
      bottomPadding.style.visibility = 'hidden';
      
      wheel.insertBefore(topPadding, wheel.firstChild);
      wheel.appendChild(bottomPadding);
      
      console.log(`Added padding to wheel, new scroll height: ${wheel.scrollHeight}px`);
    });
  }
  
  updateWheels();

  function getTime(){ 
    // Пытаемся извлечь время из разных форматов
    const dailyMatch = field.value.match(/Every day (\d{2}:\d{2})$/);
    const weeklyMatch = field.value.match(/Every \w+ (\d{2}:\d{2})$/);
    
    if (dailyMatch) return dailyMatch[1];
    if (weeklyMatch) return weeklyMatch[1];
    
    // Fallback - ищем любое время в формате HH:MM
    const timeMatch = field.value.match(/(\d{2}:\d{2})$/);
    return timeMatch ? timeMatch[1] : '09:00';
  }
  function setField(hhmm){ 
    // Проверяем режим выплаты
    const typeSelect = document.getElementById('rbm-type');
    const selectedValue = typeSelect?.querySelector('.select-value')?.textContent;
    
    console.log('setField called with:', hhmm, 'selectedValue:', selectedValue);
    
    if (selectedValue === 'Auto weekly') {
      // Для еженедельного режима используем выбранный день
      const weekChips = document.querySelector('.week-chips');
      const selectedDay = weekChips?.dataset.selectedWd;
      const dayName = window.WEEKDAY_NAMES[selectedDay] || 'Monday';
      console.log('Weekly mode - selectedDay:', selectedDay, 'dayName:', dayName);
      field.value = `Every ${dayName} ${hhmm}`;
    } else {
      // Для ежедневного режима
      console.log('Daily mode - using prefix');
      field.value = prefix + hhmm;
    }
    
    console.log('Final field value:', field.value);
    
    // Обновляем текст с ближайшей выплатой при изменении времени
    updateNextPayoutText();
  }

  const ROW = 44;
  function scrollToIndex(el, idx){ 
    // Учитываем отступ сверху (110px)
    const paddingTop = 110;
    
    // Для 12-часового формата конвертируем 24-часовой индекс в 12-часовой
    let displayIdx = idx;
    if (el === wheelH && is12HourFormat) {
      // В 12-часовом формате колесо имеет индексы 0-11 (отображаются как 1-12)
      // idx 1-12 нужно конвертировать в индексы 0-11
      displayIdx = idx - 1; // 1 -> 0, 12 -> 11
    }
    
    const scrollTop = paddingTop + (displayIdx * ROW) - (el.clientHeight / 2 - ROW / 2);
    const maxScroll = el.scrollHeight - el.clientHeight;
    const finalScrollTop = Math.max(0, Math.min(scrollTop, maxScroll));
    
    console.log(`Scrolling to index ${idx} (display: ${displayIdx}), scrollTop: ${scrollTop}, finalScrollTop: ${finalScrollTop}, maxScroll: ${maxScroll}, wheel: ${el === wheelH ? 'hours' : 'minutes'}`);
    el.scrollTo({ top: finalScrollTop, behavior: 'auto' }); 
  }

  let tmr;
  let isScrolling = false;
  
  function onScrollEnd(el){
    if (isScrolling) return; // Предотвращаем рекурсивные вызовы
    
    clearTimeout(tmr);
    tmr = setTimeout(()=>{
      isScrolling = true;
      const paddingTop = 110;
      const center = el.scrollTop + el.clientHeight/2;
      let idx = Math.round((center - paddingTop) / ROW);
      
      // Исправляем расчет для случая, когда scrollTop близок к paddingTop
      if (el.scrollTop <= paddingTop + ROW/2) {
        idx = 0; // Если прокрутка в начале, то индекс 0
      }
      
      console.log(`onScrollEnd: wheel=${el === wheelH ? 'hours' : 'minutes'}, scrollTop=${el.scrollTop}, center=${center}, calculated idx=${idx}`);
      
      // Для 12-часового формата конвертируем индекс в отображаемое значение
      if (el === wheelH && is12HourFormat) {
        // В 12-часовом формате колесо имеет индексы 0-11 (отображаются как 1-12)
        // idx 0-11 нужно конвертировать в 1-12
        idx = Math.max(0, Math.min(11, idx)); // Ограничиваем 0-11
        idx = idx + 1; // Конвертируем в 1-12
      }
      
      const maxIdx = el === wheelH ? (is12HourFormat ? 12 : 24) : 60;
      const minIdx = el === wheelH ? (is12HourFormat ? 1 : 0) : 0;
      const clampedIdx = Math.max(minIdx, Math.min(idx, maxIdx));
      
      console.log(`Auto-scrolling to index ${clampedIdx} for ${el === wheelH ? 'hours' : 'minutes'}`);
      scrollToIndex(el, clampedIdx);
      syncManual();
      
      setTimeout(() => {
        isScrolling = false;
      }, 100);
    }, 80);
  }
  // Event listeners are now handled in addTimePickerEventListeners()

  function syncManual(){
    // Учитываем отступ сверху (110px)
    const paddingTop = 110;
    let h = Math.round((window.wheelH.scrollTop - paddingTop + window.wheelH.clientHeight/2)/ROW - 0.5);
    let m = Math.round((window.wheelM.scrollTop - paddingTop + window.wheelM.clientHeight/2)/ROW - 0.5);
    
    console.log('syncManual: wheelH.scrollTop:', window.wheelH.scrollTop, 'wheelM.scrollTop:', window.wheelM.scrollTop, 'calculated h:', h, 'calculated m:', m, 'is12HourFormat:', is12HourFormat);
    
    // Для 12-часового формата конвертируем 1-12 в 24-часовой формат
    if (is12HourFormat) {
      // В 12-часовом формате колесо имеет индексы 0-11 (отображаются как 1-12)
      // Ограничиваем индекс 0-11 для 12-часового формата
      h = Math.max(0, Math.min(11, h));
      h = h + 1; // Конвертируем индекс в отображаемое значение 1-12
      console.log('syncManual: после конвертации h:', h);
    } else {
      // В 24-часовом формате ограничиваем 0-23
      h = Math.max(0, Math.min(23, h));
    }
    
    // Ограничиваем минуты 0-59
    m = Math.max(0, Math.min(59, m));
    
    console.log('syncManual: final h:', h, 'final m:', m);
    
    const t = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
    window.manual.value = t; window.btnApply.disabled = !/^\d{2}:\d{2}$/.test(t);
  }
  
  // Manual input event listeners are now handled in addTimePickerEventListeners()

  // Функция для открытия календаря (месячный режим)
  function openCalendar() {
    console.log('=== openCalendar called ===');
    const fieldRect = field.getBoundingClientRect();
    console.log('Opening calendar, field rect:', fieldRect);
    
    // Создаем календарь
    const calendarHTML = `
      <div class="tp-dialog">
        <div class="tp-title-row">
          <h3 class="tp-title">Select day of month</h3>
          <div class="tp-format-chips">
            <div class="tp-chip" data-format="24h">24h</div>
            <div class="tp-chip tp-chip--active" data-format="12h">12h</div>
          </div>
        </div>
        <div class="calendar-grid">
          ${generateCalendarDays()}
        </div>
        <div class="tp-footer">
          <input id="calendar-time-input" class="tp-inp" placeholder="HH:MM" inputmode="numeric" maxlength="5" value="09:00" />
          <button class="tp-btn" data-act="now-calendar">Now</button>
          <button class="tp-btn tp-btn--primary" data-act="apply-calendar">Apply</button>
        </div>
      </div>
    `;
    
    // Позиционируем dropdown с фиксированными координатами
    dropdown.style.display = 'block';
    dropdown.style.left = '25px';
    dropdown.style.top = '224px';
    dropdown.classList.add('active');
    
    dropdown.innerHTML = calendarHTML;
    
    // Добавляем обработчики для календаря
    addCalendarEventListeners();
  }
  
  // Генерация дней календаря
  function generateCalendarDays() {
    let html = '';
    
    for (let day = 1; day <= 31; day++) {
      const isSelected = day === 1; // Выбираем 1 число по умолчанию
      let dayClass = 'calendar-day';
      if (isSelected) {
        dayClass += ' selected';
      }
      html += `<div class="${dayClass}" data-day="${day}">${day}</div>`;
    }
    return html;
  }
  
  // Добавление обработчиков для календаря
  function addCalendarEventListeners() {
    // Кэшируем все дни календаря для лучшей производительности
    const calendarDays = dropdown.querySelectorAll('.calendar-day');
    
    // Обработчики для дней календаря
    dropdown.querySelectorAll('.calendar-day').forEach(dayEl => {
      dayEl.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Убираем выделение с других дней
        dropdown.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
        
        // Выделяем выбранный день
        dayEl.classList.add('selected');
        
        console.log('Выбран день:', dayEl.dataset.day);
        
        // Обновляем текст с ближайшей выплатой при изменении дня месяца
        updateNextPayoutText();
      });
    });
    
    // Обработчики для чипсов формата времени
    dropdown.querySelectorAll('.tp-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Убираем активный класс со всех чипсов
        dropdown.querySelectorAll('.tp-chip').forEach(c => c.classList.remove('tp-chip--active'));
        
        // Добавляем активный класс к выбранному чипсу
        chip.classList.add('tp-chip--active');
        
      });
    });
    
    // Обработчик поля ввода времени
    const timeInput = dropdown.querySelector('#calendar-time-input');
    if (timeInput) {
      timeInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/[^0-9]/g,'').slice(0,4);
        if (v.length >= 3) v = v.slice(0,2) + ':' + v.slice(2);
        e.target.value = v;
      });
    }
    
    // Обработчик кнопки "Обновить на текущее"
    const nowBtn = dropdown.querySelector('[data-act="now-calendar"]');
    if (nowBtn) {
      nowBtn.addEventListener('click', () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        
        if (timeInput) {
          timeInput.value = currentTime;
        }
      });
    }
    
    // Apply button handler
    const applyBtn = dropdown.querySelector('[data-act="apply-calendar"]');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const selectedDay = dropdown.querySelector('.calendar-day.selected');
        if (selectedDay) {
          const day = selectedDay.dataset.day;
          const time = timeInput ? timeInput.value : '09:00';
          
          // Проверяем, что время в правильном формате
          const timeMatch = time.match(/^(\d{2}):(\d{2})$/);
          const finalTime = timeMatch ? time : '09:00';
          
          field.value = `Every ${day}th of the month ${finalTime}`;
          
          // Обновляем информационный текст
          updateMonthlyNoteText(day, finalTime);
        }
        close();
      });
    }
  }
  
  // Обновление информационного текста для месячного режима
  function updateMonthlyNoteText(day, time) {
    const noteText = document.getElementById('rb-note-text');
    if (noteText) {
      const clientName = document.querySelector('#rbm-client').textContent;
      noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically on the ${day}st day of each month at ${time}. You can reject automatic payouts in <b>Trade Payout Approval</b>.`;
    }
  }

  function open(){
    console.log('Opening time picker dropdown');
    
    // Проверяем, выбран ли месячный режим
    const typeSelect = document.getElementById('rbm-type');
    const selectedType = typeSelect?.querySelector('.select-value')?.textContent;
    console.log('Selected type for time picker:', selectedType);
    
    if (selectedType === 'Auto monthly') {
      console.log('Opening calendar for monthly mode');
      openCalendar();
      return;
    }
    
    console.log('Not monthly mode, using regular time picker for:', selectedType);
    
    // Убеждаемся, что dropdown видим
    dropdown.style.display = 'block';
    
    // Позиционируем dropdown с фиксированными координатами
    dropdown.style.left = '25px';
    dropdown.style.top = '224px';
    dropdown.classList.add('active');
    
    console.log('Dropdown styles set:', dropdown.style.cssText);
    console.log('Dropdown visible:', dropdown.offsetWidth, 'x', dropdown.offsetHeight);
    console.log('Dropdown content:', dropdown.innerHTML.substring(0, 200) + '...');
    
    // Убеждаемся, что контент dropdown инициализирован
    if (!dropdown.querySelector('.tp-dialog')) {
      console.log('Dropdown content not found, initializing...');
      
      // Определяем, нужно ли показывать week-chips
      const showWeekChips = selectedType === 'Auto weekly';
      console.log('Show week chips:', showWeekChips, 'for type:', selectedType);
      
      // Если контент отсутствует, создаем его
      dropdown.innerHTML = `
        <div class="tp-dialog">
          <div class="tp-title-row">
            <h3 class="tp-title">Select time</h3>
            <div class="tp-format-chips">
              <div class="tp-chip" data-format="24h">24h</div>
              <div class="tp-chip tp-chip--active" data-format="12h">12h</div>
            </div>
          </div>
          ${showWeekChips ? `
          <div class="week-chips" role="tablist" aria-label="Day of week">
            <button class="chip is-active" data-wd="mon" role="tab" aria-selected="true">Mon</button>
            <button class="chip" data-wd="tue" role="tab" aria-selected="false">Tue</button>
            <button class="chip" data-wd="wed" role="tab" aria-selected="false">Wed</button>
            <button class="chip" data-wd="thu" role="tab" aria-selected="false">Thu</button>
            <button class="chip" data-wd="fri" role="tab" aria-selected="false">Fri</button>
            <button class="chip" data-wd="sat" role="tab" aria-selected="false">Sat</button>
            <button class="chip" data-wd="sun" role="tab" aria-selected="false">Sun</button>
          </div>
          ` : ''}
          <div class="tp-wheels">
            <div id="wheel-hours" class="wheel" aria-label="Часы (00–23)" role="listbox"></div>
            <div class="colon" aria-hidden>:</div>
            <div id="wheel-minutes" class="wheel" aria-label="Минуты (00–59)" role="listbox"></div>
            <div class="selector" aria-hidden="true"></div>
          </div>
          <div class="tp-footer">
            <input id="tp-manual" class="tp-inp" placeholder="HH:MM" inputmode="numeric" maxlength="5" />
            <button class="tp-btn" data-act="now">Now</button>
            <button class="tp-btn tp-btn--primary" data-act="apply" disabled>Apply</button>
          </div>
        </div>
      `;
      
      // Переинициализируем элементы после создания контента
      const newWheelH = dropdown.querySelector('#wheel-hours');
      const newWheelM = dropdown.querySelector('#wheel-minutes');
      const newManual = dropdown.querySelector('#tp-manual');
      const newBtnApply = dropdown.querySelector('[data-act="apply"]');
      
      console.log('Found elements after content creation:', {
        wheelH: !!newWheelH,
        wheelM: !!newWheelM,
        manual: !!newManual,
        btnApply: !!newBtnApply
      });
      
      if (newWheelH && newWheelM && newManual && newBtnApply) {
        // Обновляем ссылки на элементы
        window.wheelH = newWheelH;
        window.wheelM = newWheelM;
        window.manual = newManual;
        window.btnApply = newBtnApply;
        
        console.log('Elements updated, initializing wheels...');
        
        // Переинициализируем колеса
        console.log('About to call updateWheels, wheelH:', window.wheelH, 'wheelM:', window.wheelM);
        updateWheels();
        console.log('After updateWheels, wheelH innerHTML length:', window.wheelH ? window.wheelH.innerHTML.length : 'null');
        
        // Добавляем обработчики событий
        addTimePickerEventListeners();
        
        console.log('Time picker initialization complete');
      } else {
        console.error('Failed to find required elements in dropdown');
      }
    }
    
    // Ждем, пока отступы добавятся, затем устанавливаем время
    setTimeout(() => {
      let targetHour, targetMinute;
      
      // Для еженедельного режима устанавливаем 09:00 по умолчанию
      if (selectedType === 'Auto weekly') {
        targetHour = 9;
        targetMinute = 0;
        console.log('Weekly mode - setting default time 09:00');
      } else {
        // Для других режимов используем текущее время
        const now = new Date();
        targetHour = now.getHours();
        targetMinute = now.getMinutes();
        console.log('Other mode - setting current time:', targetHour, targetMinute);
      }
      
      // Для 12-часового формата конвертируем время
      if (is12HourFormat) {
        if (targetHour === 0) targetHour = 12; // 00:00 -> 12:00
        else if (targetHour > 12) targetHour = targetHour - 12; // 13:00 -> 1:00
      }
      
      console.log('Setting time:', targetHour, targetMinute, 'is12HourFormat:', is12HourFormat);
      scrollToIndex(window.wheelH, targetHour); 
      scrollToIndex(window.wheelM, targetMinute);
      
      // Устанавливаем время в поле ввода
      const timeString = String(targetHour).padStart(2,'0') + ':' + String(targetMinute).padStart(2,'0');
      window.manual.value = timeString;
      window.btnApply.disabled = false;
      
      // Инициализируем чипсы дней недели если они видимы
      const weekChips = document.querySelector('.week-chips');
      if (weekChips && weekChips.style.display !== 'none') {
        // Добавляем обработчики кликов для чипов
        addWeekChipsClickHandlers(weekChips);
        const defaultChip = weekChips.querySelector('[data-wd="mon"]');
        if (defaultChip && !weekChips.dataset.selectedWd) {
          // Используем новую функцию для установки активного чипса
          if (window.setActiveChip) {
            window.setActiveChip(defaultChip);
          } else {
            // Fallback к старой логике
            weekChips.dataset.selectedWd = 'mon';
            defaultChip.classList.add('is-active');
            defaultChip.setAttribute('aria-selected', 'true');
            
            // Стили теперь управляются через CSS классы
            
            // Сбрасываем стили для остальных чипсов
            weekChips.querySelectorAll('.chip').forEach(c => {
              if (c !== defaultChip) {
                c.classList.remove('is-active');
                c.setAttribute('aria-selected', 'false');
              }
            });
          }
          
          console.log('Week chips initialized in time picker');
        }
      }
    }, 150);
  }
  
  function close(){ 
    dropdown.style.display = 'none';
    dropdown.classList.remove('active');
  }
  
  function apply(){ 
    setField(window.manual.value); 
    
    // Проверяем режим выплаты
    const typeSelect = document.getElementById('rbm-type');
    const selectedValue = typeSelect?.querySelector('.select-value')?.textContent;
    
    // Обновляем текст с ближайшей выплатой
    updateNextPayoutText();
    
    // Обновляем информационный текст с выбранным временем
    const noteText = document.querySelector('.rb-note');
    if (noteText) {
      const selectedTime = window.manual.value;
      
      if (selectedValue === 'Auto weekly') {
        // Для еженедельного режима используем выбранный день
        const weekChips = document.querySelector('.week-chips');
        const selectedDay = weekChips?.dataset.selectedWd;
        const dayName = window.WEEKDAY_NAMES[selectedDay] || 'Monday';
        const clientName = document.querySelector('#rbm-client').textContent;
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically every week on ${dayName} at ${selectedTime}. You can reject automatic payouts in <b>Trade Payout Approval</b>.`;
      } else {
        // Для ежедневного режима
        const clientName = document.querySelector('#rbm-client').textContent;
        noteText.innerHTML = `Rebate payouts for <span id="rbm-client">${clientName}</span>'s trades will be paid automatically every day at ${selectedTime}. You can cancel automatic payouts in <b>Trade Payout Approval</b>.`;
      }
    }
    
    close(); 
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const isDropdownElement = dropdown.contains(e.target);
    const isFieldElement = field.contains(e.target) || timeIcon.contains(e.target);
    const isOtherDropdown = e.target.closest('.select') && !e.target.closest('#rbm-period');
    
    if (!isDropdownElement && !isFieldElement && !isOtherDropdown) {
      close();
    }
  });
  
  // Now button and apply button event listeners are now handled in addTimePickerEventListeners()

  // Format chip event listeners are now handled in addTimePickerEventListeners()

  // Функция для добавления обработчиков событий к time picker
  function addTimePickerEventListeners() {
    // Обработчики для колес
    window.wheelH.addEventListener('scroll', ()=> {
      setTimeout(() => {
        syncManual();
      }, 50);
    });
    
    window.wheelM.addEventListener('scroll', ()=> {
      setTimeout(() => {
        syncManual();
      }, 50);
    });
    
    // Обработчики для кликов по элементам колеса
    window.wheelH.addEventListener('click', (e) => {
      if (e.target.classList.contains('item')) {
        setTimeout(() => {
          syncManual();
        }, 100);
      }
    });
    
    window.wheelM.addEventListener('click', (e) => {
      if (e.target.classList.contains('item')) {
        setTimeout(() => {
          syncManual();
        }, 100);
      }
    });
    
    // Обработчик для поля ввода
    window.manual.addEventListener('input', (e)=>{
      let v = e.target.value.replace(/[^0-9]/g,'').slice(0,4);
      if (v.length>=3) v = v.slice(0,2)+':'+v.slice(2);
      e.target.value = v;
      const ok = /^\d{2}:\d{2}$/.test(v); 
      window.btnApply.disabled = !ok;
      console.log('Manual input:', v, 'ok:', ok);
      if (ok){ 
        const [hh,mm]=v.split(':').map(Number); 
        console.log('Setting wheels to:', hh, mm);
        scrollToIndex(window.wheelH, hh); 
        scrollToIndex(window.wheelM, mm); 
        setTimeout(() => {
          syncManual();
        }, 100);
      }
    });
    
    window.manual.addEventListener('keydown', (e)=>{ 
      if(e.key==='Enter' && !window.btnApply.disabled) apply(); 
      if(e.key==='Escape') close(); 
    });
    
    window.manual.addEventListener('blur', (e) => {
      const currentValue = e.target.value;
      if (!currentValue || !/^\d{2}:\d{2}$/.test(currentValue)) {
        setTimeout(() => {
          syncManual();
        }, 50);
      }
    });
    
    // Обработчик для кнопки "Обновить на текущее"
    const nowBtn = dropdown.querySelector('[data-act="now"]');
    if (nowBtn) {
      nowBtn.addEventListener('click', ()=>{
        const d = new Date();
        let currentHour = d.getHours();
        let currentMinute = d.getMinutes();
        
        if (is12HourFormat) {
          if (currentHour === 0) currentHour = 12;
          else if (currentHour > 12) currentHour = currentHour - 12;
        }
        
        const t = String(currentHour).padStart(2,'0') + ':' + String(currentMinute).padStart(2,'0');
        window.manual.value = t; 
        scrollToIndex(window.wheelH, currentHour); 
        scrollToIndex(window.wheelM, currentMinute); 
        window.btnApply.disabled = false;
      });
    }
    
    // Apply button handler
    window.btnApply.addEventListener('click', apply);
    
    // Обработчики для чипсов формата времени
    dropdown.querySelectorAll('.tp-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        
        dropdown.querySelectorAll('.tp-chip').forEach(c => c.classList.remove('tp-chip--active'));
        chip.classList.add('tp-chip--active');
        
        const format = chip.dataset.format;
        is12HourFormat = format === '12h';
        
        console.log('Format changed to:', format);
        updateWheels();
        syncManual();
      });
    });
  }

  // иконка часов открывает dropdown
  (timeIcon || document).addEventListener('click', (e)=>{ 
    if(e.target.closest('.time-icon') || e.target.closest('.rb-time-icon')){ 
      e.preventDefault(); 
      console.log('Opening time picker dropdown');
      open(); 
    } 
  });
});

// ===== end time picker functionality =====

// ===== Week chips functionality =====
// Словарь для преобразования дней недели (глобальный)
window.WEEKDAY_NAMES = {
  'mon': 'Monday',
  'tue': 'Tuesday', 
  'wed': 'Wednesday',
  'thu': 'Thursday',
  'fri': 'Friday',
  'sat': 'Saturday',
  'sun': 'Sunday'
};

(function(){
  const wrap = document.querySelector('.week-chips');
  if (!wrap) return;
  
  // Функция для обновления поля периода
  function updatePeriodField() {
    const selectedDay = wrap.dataset.selectedWd;
    const timeField = document.getElementById('rbm-time');
    
    console.log('updatePeriodField called - selectedDay:', selectedDay, 'timeField:', timeField);
    
    if (selectedDay && timeField) {
      const dayName = window.WEEKDAY_NAMES[selectedDay];
      console.log('selectedDay:', selectedDay, 'WEEKDAY_NAMES:', window.WEEKDAY_NAMES, 'dayName:', dayName);
      
      // Извлекаем время из текущего значения поля
      let currentTime = '09:00';
      const timeMatch = timeField.value.match(/(\d{2}:\d{2})$/);
      if (timeMatch) {
        currentTime = timeMatch[1];
      }
      
      console.log('currentTime:', currentTime);
      timeField.value = `Every ${dayName} ${currentTime}`;
      console.log('Updated field value:', timeField.value);
    }
  }
  
  // Функция для переключения активного чипса
  function setActiveChip(activeChip) {
    console.log('=== setActiveChip called ===');
    console.log('Active chip:', activeChip);
    console.log('Active chip dataset.wd:', activeChip.dataset.wd);
    console.log('Wrap element:', wrap);
    console.log('All chips found:', wrap.querySelectorAll('.chip').length);
    
    // Убираем активный класс у всех чипсов
    wrap.querySelectorAll('.chip').forEach(c => {
      console.log('Deactivating chip:', c.dataset.wd);
      c.classList.remove('is-active');
      c.setAttribute('aria-selected', 'false');
    });
    
    // Добавляем активный класс к выбранному чипсу
    console.log('Activating chip:', activeChip.dataset.wd);
    activeChip.classList.add('is-active');
    activeChip.setAttribute('aria-selected', 'true');
    
    // Сохраняем выбранный день
    wrap.dataset.selectedWd = activeChip.dataset.wd;
    
    console.log('Active chip set to:', activeChip.dataset.wd);
    console.log('Chip classes:', activeChip.className);
    console.log('Chip styles:', activeChip.style.cssText);
    
    // Стили теперь управляются через CSS классы
    
    // Обновляем поле периода
    updatePeriodField();
    
    // Обновляем текст с ближайшей выплатой при изменении дня недели
    updateNextPayoutText();
    
    console.log('=== setActiveChip finished ===');
  }
  
  // Обработчики кликов теперь добавляются динамически через addWeekChipsClickHandlers()
  
  // Добавляем обработчики кликов при загрузке, если чипы уже видимы
  if (wrap && wrap.style.display !== 'none') {
    addWeekChipsClickHandlers(wrap);
  }
  
  // Также добавляем обработчики при изменении видимости чипсов
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target.classList.contains('week-chips') && target.style.display !== 'none') {
          addWeekChipsClickHandlers(target);
        }
      }
    });
  });
  
  // Наблюдаем за изменениями в DOM
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style']
  });
  
  // Экспортируем функции для использования в time picker
  window.updatePeriodField = updatePeriodField;
  window.setActiveChip = setActiveChip;
  
  // Экспортируем функции для тестирования
  window.addWeekChipsClickHandlers = addWeekChipsClickHandlers;
  window.resetRebateFields = resetRebateFields;
})();
// ===== end week chips functionality =====

// ===== TAB CLICK HANDLER =====
// Обработчик для предотвращения нежелательного переключения тогла при клике на вкладки
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tabs .tab');
  const filtersClients = document.getElementById('filters-clients');
  const filtersOperations = document.getElementById('filters-operations');
  
  console.log('Инициализация обработчика вкладок:', {
    tabs: tabs.length,
    filtersClients: !!filtersClients,
    filtersOperations: !!filtersOperations
  });
  
  // Устанавливаем начальное состояние - показываем фильтры клиентов
  if (filtersClients) filtersClients.style.display = 'grid';
  if (filtersOperations) filtersOperations.style.display = 'none';
  
  // Инициализируем размеры колонок для начального состояния (клиенты)
  updateTableHeader();
  
  // Инициализируем синхронизацию процента ребейта
  console.log('Инициализируем синхронизацию процента ребейта...');
  syncRebatePercent();
  
  // Инициализируем синхронизацию типа выплаты
  console.log('Инициализируем синхронизацию типа выплаты...');
  syncRebateType();
  
  // Инициализируем обновление статусов
  console.log('Инициализируем обновление статусов...');
  updateOperationStatuses();
  
  // Добавляем обработчик для кнопки сброса фильтра
  const resetFilterBtn = document.getElementById('reset-filter-btn');
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      console.log('=== СБРОС ФИЛЬТРА ПО КНОПКЕ ===');
      resetFilter();
      
      // Переключаемся на полный список операций
      rows = rowsOperations;
      isOperationsData = true;
      
      // Синхронизируем процент ребейта
      console.log('Синхронизируем процент ребейта при сбросе фильтра...');
      syncRebatePercent();
      
      // Синхронизируем тип выплаты
      console.log('Синхронизируем тип выплаты при сбросе фильтра...');
      syncRebateType();
      
      // Обновляем статусы операций
      console.log('Обновляем статусы операций при сбросе фильтра...');
      updateOperationStatuses();
      
      // Обновляем UI
      updateTableHeader();
      renderTable();
      updateFooter();
      
      // Скрываем кнопку сброса
      const filterReset = document.getElementById('filter-reset');
      if (filterReset) {
        filterReset.style.display = 'none';
      }
    });
  }
  
  // Флаг для предотвращения множественных переключений
  let isTabSwitching = false;
  
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Сбрасываем флаг если он застрял (защита от зависания)
      if (isTabSwitching) {
        console.log('Обнаружен застрявший флаг переключения, сбрасываем');
        isTabSwitching = false;
      }
      
      isTabSwitching = true;
      
      // Защита от зависания - автоматический сброс флага через 5 секунд
      setTimeout(() => {
        if (isTabSwitching) {
          console.log('Automatic reset of switching flag (protection against hanging)');
          isTabSwitching = false;
        }
      }, 5000);
      
      // Закрываем все контекстные меню при переключении вкладок
      const menuIds = ['context-menu', 'approval-menu', 'approved-menu'];
      menuIds.forEach(menuId => {
        const menu = document.getElementById(menuId);
        if (menu) {
          menu.style.display = 'none';
          console.log(`Закрыто меню при переключении вкладки: ${menuId}`);
        }
      });
      
      // Снимаем активный класс со всех вкладок
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      
      // Добавляем активный класс к нажатой вкладке
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      
      // Обновляем текст в card-sub в зависимости от активной вкладки
      const cardSub = document.querySelector('.card-sub');
      if (cardSub) {
        if (tab.textContent.trim() === 'Configurable Clients') {
          cardSub.innerHTML = 'Clients who haven\'t started trading yet are listed in the report <a href="#">My clients</a> <span class="arrow-8" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
        } else {
          cardSub.innerHTML = 'Paid rebate operations are displayed in <a href="#">Operations History</a> <span class="arrow-8" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
        }
      }
      
      // Переключаем фильтры и данные таблицы в зависимости от вкладки
      if (tab.textContent.trim() === 'Trade Payout Approval') {
        // Обновляем операции перед переключением на вкладку
        console.log('Обновляем операции перед переключением на вкладку операций...');
        generateOperationsFromClients();
        
        // Показываем фильтры для операций
        if (filtersClients) filtersClients.style.display = 'none';
        if (filtersOperations) filtersOperations.style.display = 'flex';
        
        // Скрываем кнопку сброса фильтра во вкладке операций
        const filterReset = document.getElementById('filter-reset');
        if (filterReset) {
          filterReset.style.display = 'none';
        }
        
        // Переключаем данные таблицы на операции (фильтрованные или все)
        if (isFilteredMode) {
          rows = filteredOperations;
          isOperationsData = true;
        console.log('Переключена вкладка: Trade Payout Approval - показаны ОТФИЛЬТРОВАННЫЕ операции для клиента:', filteredClientName);
        } else {
          rows = rowsOperations;
          isOperationsData = true;
          console.log('Переключена вкладка: Trade Payout Approval - показаны ВСЕ операции');
        }
        
        console.log('=== TAB SWITCH DEBUG ===');
        console.log('rows after switch:', rows);
        console.log('rows === rowsOperations:', rows === rowsOperations);
        console.log('rows === filteredOperations:', rows === filteredOperations);
        console.log('isOperationsData:', isOperationsData);
      } else {
        // Показываем фильтры для клиентов
        if (filtersClients) filtersClients.style.display = 'grid';
        if (filtersOperations) filtersOperations.style.display = 'none';
        
        // Переключаем данные таблицы на клиентов и сбрасываем фильтр
        rows = rowsClients;
        isOperationsData = false;
        resetFilter(); // сбрасываем фильтр при переключении на клиентов
        
        // Синхронизируем процент ребейта от операций к клиентам
        console.log('Синхронизируем процент ребейта от операций к клиентам...');
        syncRebatePercentFromOperations();
        
        // Скрываем кнопку сброса фильтра
        const filterReset = document.getElementById('filter-reset');
        if (filterReset) {
          filterReset.style.display = 'none';
        }
        
        console.log('Переключена вкладка: Configurable Clients - показаны фильтры клиентов и данные клиентов, фильтр сброшен');
      }
      
      // Синхронизируем процент ребейта перед переключением
      console.log('Синхронизируем процент ребейта перед переключением вкладки...');
      syncRebatePercent();
      
      // Синхронизируем тип выплаты перед переключением
      console.log('Синхронизируем тип выплаты перед переключением вкладки...');
      syncRebateType();
      
      // Обновляем статусы операций
      console.log('Обновляем статусы операций перед переключением вкладки...');
      updateOperationStatuses();
      
      // Обновляем заголовок таблицы в зависимости от вкладки
      updateTableHeader();
      
      // Перерисовываем таблицу с новыми данными
      renderTable();
      
      // Переинициализируем select all после перерисовки таблицы
      setTimeout(() => {
        initializeSelectAll();
        syncSelectAllState();
      }, 100);
      
      // Применяем сохраненную сортировку к отфильтрованным данным
      if (isFilteredMode && originalSortState && originalSortState.column) {
        console.log('Применяем сохраненную сортировку к отфильтрованным данным:', originalSortState);
        sortBy(originalSortState.column, originalSortState.direction);
      }
      
      
      // Обновляем футер в зависимости от выбранной вкладки с задержкой
      setTimeout(() => {
        updateFooter();
        // Сбрасываем флаг после завершения всех операций
        isTabSwitching = false;
        console.log('Переключение вкладки завершено, флаг сброшен');
      }, 100);
    });
  });
});
// ===== end tab click handler =====

// Функция фильтрации операций по клиенту
function filterOperationsByClient(clientName) {
  console.log('=== ФИЛЬТРАЦИЯ ОПЕРАЦИЙ ПО КЛИЕНТУ ===');
  console.log('Клиент:', clientName);
  console.log('Все операции:', rowsOperations);
  
  // Фильтруем операции по имени клиента
  const clientOperations = rowsOperations.filter(operation => operation.name === clientName);
  
  console.log(`Найдено ${clientOperations.length} операций для клиента ${clientName}:`, clientOperations);
  
  // Создаем массив с дубликатами для каждой операции клиента
  filteredOperations = [];
  
  clientOperations.forEach((operation, index) => {
    // Добавляем оригинальную операцию
    filteredOperations.push(operation);
    
    // Создаем дубликат для каждой операции
    const duplicateOperation = {
      ...operation,
      // Добавляем уникальный идентификатор для дубликата
      id: operation.id + '_duplicate',
      account: operation.account + '_duplicate',
      // Небольшое изменение для различения
      profit: operation.profit + 0.01,
    };
    
    console.log('Создание дубликата:');
    console.log('Оригинальная операция ID:', operation.id);
    console.log('Дубликат операции ID:', duplicateOperation.id);
    
    // Добавляем дубликат
    filteredOperations.push(duplicateOperation);
    
    console.log(`Создан дубликат для операции ${index + 1}:`, duplicateOperation);
  });
  
  filteredClientName = clientName;
  isFilteredMode = true;
  
  console.log('Отфильтрованные операции с дубликатами:', filteredOperations);
  console.log('Количество отфильтрованных операций:', filteredOperations.length);
  
  return filteredOperations;
}

// Функция сброса фильтра
function resetFilter() {
  console.log('=== СБРОС ФИЛЬТРА ===');
  isFilteredMode = false;
  filteredOperations = [];
  filteredClientName = '';
  originalSortState = null;
  console.log('Фильтр сброшен');
}

// Функция синхронизации процента ребейта между клиентами и операциями
function syncRebatePercent() {
  console.log('=== СИНХРОНИЗАЦИЯ ПРОЦЕНТА РЕБЕЙТА ===');
  
  // Проходим по всем клиентам
  rowsClients.forEach(client => {
    // Находим все операции этого клиента
    const clientOperations = rowsOperations.filter(operation => operation.name === client.name);
    
    // Синхронизируем процент ребейта
    clientOperations.forEach(operation => {
      operation.percent = client.percent;
      console.log(`Синхронизирован процент для ${client.name}: ${client.percent}%`);
    });
  });
  
  // Если мы в фильтрованном режиме, обновляем и отфильтрованные данные
  if (isFilteredMode) {
    filteredOperations.forEach(operation => {
      const client = rowsClients.find(c => c.name === operation.name);
      if (client) {
        operation.percent = client.percent;
        console.log(`Синхронизирован процент для отфильтрованной операции ${operation.name}: ${client.percent}%`);
      }
    });
  }
  
  console.log('Синхронизация завершена');
}

// Функция синхронизации процента ребейта от операций к клиентам
function syncRebatePercentFromOperations() {
  console.log('=== СИНХРОНИЗАЦИЯ ПРОЦЕНТА РЕБЕЙТА ОТ ОПЕРАЦИЙ К КЛИЕНТАМ ===');
  
  // Проходим по всем операциям
  rowsOperations.forEach(operation => {
    // Находим клиента с таким же именем
    const client = rowsClients.find(c => c.name === operation.name);
    if (client) {
      // Обновляем процент у клиента на основе операции
      client.percent = operation.percent;
      console.log(`Синхронизирован процент для клиента ${client.name}: ${operation.percent}%`);
    }
  });
  
  console.log('Синхронизация от операций к клиентам завершена');
}

// Функция синхронизации типа выплаты между клиентами и операциями
function syncRebateType() {
  console.log('=== СИНХРОНИЗАЦИЯ ТИПА ВЫПЛАТЫ ===');
  
  // Проходим по всем клиентам
  rowsClients.forEach(client => {
    // Находим все операции этого клиента
    const clientOperations = rowsOperations.filter(operation => operation.name === client.name);
    
    // Синхронизируем тип выплаты только для операций настроенных клиентов
    clientOperations.forEach(operation => {
      // Преобразуем rebateTypeText в operationType
      if (client.rebateTypeText) {
        operation.operationType = client.rebateTypeText;
        console.log(`Синхронизирован тип выплаты для ${client.name}: ${client.rebateTypeText}`);
      } else {
        // Если тип ребейта не настроен, операции не должны существовать
        console.log(`Клиент ${client.name} не настроен, операция не должна существовать`);
      }
    });
  });
  
  // Если мы в фильтрованном режиме, обновляем и отфильтрованные данные
  if (isFilteredMode) {
    filteredOperations.forEach(operation => {
      const client = rowsClients.find(c => c.name === operation.name);
      if (client && client.rebateTypeText) {
        operation.operationType = client.rebateTypeText;
        console.log(`Синхронизирован тип выплаты для отфильтрованной операции ${operation.name}: ${operation.operationType}`);
      }
    });
  }
  
  console.log('Синхронизация типа выплаты завершена');
}

// Функция обновления статусов на основе типа выплаты
function updateOperationStatuses() {
  console.log('=== ОБНОВЛЕНИЕ СТАТУСОВ ОПЕРАЦИЙ ===');
  
  // Проходим по всем операциям
  rowsOperations.forEach(operation => {
    // Находим клиента с таким же именем
    const client = rowsClients.find(c => c.name === operation.name);
    if (client) {
      // Определяем статус на основе типа выплаты
      if (client.rebateTypeText === 'Manual') {
        operation.status = 'Pending';
        console.log(`Status для ${operation.name} (Manual): Pending`);
      } else if (client.rebateTypeText && client.rebateTypeText.includes('Auto')) {
        operation.status = 'Approved';
        console.log(`Status для ${operation.name} (${client.rebateTypeText}): Approved`);
      } else {
        // Если тип выплаты не установлен, операции не должны существовать
        console.log(`Клиент ${operation.name} не настроен, операция не должна существовать`);
      }
    }
  });
  
  // Если мы в фильтрованном режиме, обновляем и отфильтрованные данные
  if (isFilteredMode) {
    filteredOperations.forEach(operation => {
      const client = rowsClients.find(c => c.name === operation.name);
      if (client) {
        if (client.rebateTypeText === 'Manual') {
          operation.status = 'Pending';
        } else if (client.rebateTypeText && client.rebateTypeText.includes('Auto')) {
          operation.status = 'Approved';
        }
        console.log(`Обновлен статус для отфильтрованной операции ${operation.name}: ${operation.status}`);
      }
    });
  }
  
  console.log('Обновление статусов завершено');
}



// Функция для расчета размеров колонок
function calculateColumnWidths(isOperationsTab) {
  const containerWidth = 1086; // ширина контейнера
  const columnGap = 13; // расстояние между колонками
  const paddingInline = 32; // падинги контейнера (16px * 2)
  
  const availableWidth = containerWidth - paddingInline;
  
  if (isOperationsTab) {
    // Для операций - 10 колонок (добавлена колонка "Group")
    const gapsWidth = columnGap * 9; // 9 промежутков между 10 колонками
    const columnsWidth = availableWidth - gapsWidth;
    
    // Распределяем ширину между колонками
    const baseWidth = Math.floor(columnsWidth / 10);
    const remainder = columnsWidth % 10;
    
    return [
      16, // чекбокс (фиксированная ширина)
      96, // Client
      144, // Trading account (шире для номера аккаунта)
      104, // Group (узкая колонка)
      84, // IB Profit
      108, // Approval type
      96, // Rebate %
      96, // Paid
      96, // Status
      96  // Action
    ];
  } else {
    // Для клиентов - 8 колонок
    const gapsWidth = columnGap * 7; // 7 промежутков между 8 колонками
    const columnsWidth = availableWidth - gapsWidth;
    
    // Распределяем ширину между колонками
    const baseWidth = Math.floor(columnsWidth / 8);
    const remainder = columnsWidth % 8;
    
    return [
      16, // чекбокс (фиксированная ширина)
      128, // Client
      180, // Trading account (шире для номера аккаунта)
      120, // IB Profit
      120, // Approval type
      120, // Rebate %
      120, // Paid
      140  // Action (шире для кнопки)
    ];
  }
}

// Функция обновления заголовка таблицы в зависимости от вкладки
function updateTableHeader() {
  const tableHead = document.querySelector('.rb-head.rb-grid');
  const rbPanel = document.querySelector('.rb-panel');
  if (!tableHead || !rbPanel) return;
  
  const isOperationsTab = rows === rowsOperations || rows === filteredOperations;
  
  // Переключаем CSS класс для grid layout
  if (isOperationsTab) {
    rbPanel.classList.add('operations-mode');
  } else {
    rbPanel.classList.remove('operations-mode');
  }
  
  // Рассчитываем и применяем размеры колонок
  const columnWidths = calculateColumnWidths(isOperationsTab);
  const colsString = columnWidths.map(width => `${width}px`).join(' ');
  rbPanel.style.setProperty('--cols', colsString);
  
  if (isOperationsTab) {
    // Для операций добавляем колонку "Status"
    tableHead.innerHTML = `
      <div class="cell cell--chk">
        <input id="select-all" type="checkbox" />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="checkbox-icon">
          <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="rgba(0, 0, 0, 0.15)" stroke-width="1" fill="none"/>
          <path class="checkmark" d="M3.33203 8.66699L5.9987 11.3337L12.6654 4.66699" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="cell">Client</div>
      <div class="cell cell--sortable" data-sort="account">
        Trading account <span class="sort-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
        </span>
      </div>
      <div class="cell">Group</div>
      <div class="cell cell--num cell--sortable" data-sort="profit">
        IB Profit <span class="sort-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
        </span>
      </div>
      <div class="cell">Approval type</div>
      <div class="cell cell--num cell--sortable" data-sort="percent">Rebate % <span class="sort-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
      </span></div>
      <div class="cell cell--num cell--sortable" data-sort="paid">To pay <span class="sort-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
      </span></div>
      <div class="cell" data-column="status">Status</div>
      <div class="cell cell--action">Action</div>
    `;
  } else {
    // Для клиентов стандартный заголовок
    tableHead.innerHTML = `
      <div class="cell cell--chk">
        <input id="select-all" type="checkbox" />
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="checkbox-icon">
          <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="rgba(0, 0, 0, 0.15)" stroke-width="1" fill="none"/>
          <path class="checkmark" d="M3.33203 8.66699L5.9987 11.3337L12.6654 4.66699" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="cell">Client</div>
      <div class="cell cell--sortable" data-sort="account">
        Trading account <span class="sort-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
        </span>
      </div>
      <div class="cell cell--num cell--sortable" data-sort="profit">
        IB Profit <span class="sort-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
        </span>
      </div>
      <div class="cell">Approval type</div>
      <div class="cell cell--num cell--sortable" data-sort="percent">Rebate % <span class="sort-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
      </span></div>
      <div class="cell cell--num cell--sortable" data-sort="paid">Rebate paid <span class="sort-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="0.5"><path d="M5.33203 6.00016L7.9987 3.3335L10.6654 6.00016M10.6654 10.0002L7.9987 12.6668L5.33203 10.0002" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
      </span></div>
      <div class="cell cell--action">Action</div>
    `;
  }
  
  // Переинициализируем обработчики сортировки для нового заголовка
  document.querySelectorAll('.rb-panel .cell--sortable').forEach((th) => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => sortBy(th.getAttribute('data-sort')));
  });
}

// Функция обновления футера (объединяет логику чекбоксов и переключения вкладок)
function updateFooter() {
  const footerContent = document.getElementById('footer-content');
  const footerButton = document.getElementById('footer-button');
  const footerStats = document.getElementById('footer-stats');
  
  if (!footerContent || !footerButton || !footerStats) return;
  
  // Проверяем, есть ли выбранные чекбоксы в активном контейнере
  // Более надежный способ определения активной вкладки
  const operationsTab = document.querySelector('.tab[aria-selected="true"]');
  const isOperationsTab = operationsTab && operationsTab.textContent.trim() === 'Trade Payout Approval';
  
  // Проверяем, есть ли контейнер операций
  const operationsContainer = document.querySelector('#operations-body');
  const clientsContainer = document.querySelector('#clients-body');
  
  let activeContainer = '#clients-body';
  let checkedBoxes = [];
  
  if (isOperationsTab && operationsContainer) {
    activeContainer = '#operations-body';
    checkedBoxes = operationsContainer.querySelectorAll('input[type="checkbox"]:checked');
  } else if (clientsContainer) {
    activeContainer = '#clients-body';
    checkedBoxes = clientsContainer.querySelectorAll('input[type="checkbox"]:checked');
  }
  
  console.log('=== updateFooter DEBUG ===');
  console.log('operationsTab:', operationsTab);
  console.log('isOperationsTab:', isOperationsTab);
  console.log('activeContainer:', activeContainer);
  console.log('checkedBoxes.length:', checkedBoxes.length);
  console.log('footerContent.style.display:', footerContent.style.display);
  console.log('footerButton.style.display:', footerButton.style.display);
  console.log('rowsOperations.length:', rowsOperations.length);
  console.log('filteredOperations.length:', filteredOperations.length);
  console.log('rows.length:', rows ? rows.length : 'undefined');
  
  if (checkedBoxes.length > 0) {
    // Показываем кнопку, скрываем тексты (логика чекбоксов)
    footerContent.style.display = 'none';
    footerButton.style.display = 'flex';
    
    // Обновляем содержимое кнопки в зависимости от вкладки
    const isOperationsTab = rows === rowsOperations || rows === filteredOperations;
    
    console.log('Footer button logic:', {
      isOperationsTab,
      rowsType: rows === rowsOperations ? 'rowsOperations' : rows === filteredOperations ? 'filteredOperations' : 'other',
      checkedBoxesCount: checkedBoxes.length
    });
    
    if (isOperationsTab) {
      // Для вкладки операций - показываем кнопки массовых операций
      footerButton.innerHTML = `
        <button class="btn btn-primary" id="approve-selected-btn">Approve payout</button>
        <button class="btn btn-secondary" id="reject-selected-btn">Reject payouts</button>
        <button class="btn btn-secondary" id="set-pending-btn">Set pending</button>
      `;
    } else {
      // Для вкладки клиентов - показываем кнопку настройки ребейта
      footerButton.innerHTML = `
        <button class="rebate-btn">Set Rebate and Groups for clients</button>
      `;
    }
  } else {
    // Показываем тексты, скрываем кнопку (логика чекбоксов)
    footerContent.style.display = 'flex';
    footerButton.style.display = 'none';
    
    // Обновляем содержимое в зависимости от вкладки
    const isOperationsTab = rows === rowsOperations || rows === filteredOperations;
    
    if (isOperationsTab) {
      // Для вкладки операций
      if (isFilteredMode) {
        // Фильтрованный режим - показываем операции конкретного клиента
        const totalOperations = filteredOperations.length;
        const totalPaid = filteredOperations.reduce((sum, row) => sum + row.paid, 0);
        
        // Рассчитываем сумму операций (колонка "Операция")
        const totalOperationsSum = filteredOperations.reduce((sum, row) => sum + (row.profit || 0), 0);
        
        footerStats.textContent = `${totalOperations} client trades`;
        footerContent.innerHTML = `
          <span>Total IB Profit from trades <b>${filteredClientName}</b>: <b class="nowrap">${totalOperationsSum.toFixed(2)} USD</b></span>
          <span>Total Rebate to pay <b>${filteredClientName}</b>: <b class="nowrap">${totalPaid.toFixed(2)} USD</b></span>
        `;
      } else {
        // Обычный режим - показываем все операции
        const totalOperations = rowsOperations.length;
        const totalPaid = rowsOperations.reduce((sum, row) => sum + row.paid, 0);
        
        // Рассчитываем сумму операций (колонка "Операция")
        const totalOperationsSum = rowsOperations.reduce((sum, row) => sum + (row.profit || 0), 0);
        
        footerStats.textContent = `${totalOperations} client trades`;
        footerContent.innerHTML = `
          <span>Total IB Profit from trades: <b class="nowrap">${totalOperationsSum.toFixed(2)} USD</b></span>
          <span>Total Rebate to pay: <b class="nowrap">${totalPaid.toFixed(2)} USD</b></span>
        `;
      }
    } else {
      // Для вкладки клиентов
      const totalProfit = rowsClients.reduce((sum, row) => sum + row.profit, 0);
      const totalPaid = rowsClients.reduce((sum, row) => sum + row.paid, 0);
      
      footerStats.textContent = `${rowsClients.length} clients 0 groups`;
      footerContent.innerHTML = `
        <span>Total IB Profit: <b class="nowrap">${totalProfit} USD</b></span>
        <span>Total rebate paid: <b class="nowrap zero-amount">${totalPaid} USD</b></span>
      `;
    }
  }
}

// ===== REBATE PERCENTAGE VALIDATION =====
function initializeRebatePercentageValidation() {
  const percentContainer = document.getElementById('rbm-percent');
  if (!percentContainer) {
    console.log('Rebate percentage container not found');
    return;
  }
  
  const percentInput = percentContainer.querySelector('input');
  if (!percentInput) {
    console.log('Rebate percentage input not found');
    return;
  }
  
  console.log('Initializing rebate percentage validation');
  
  // Add input event listener for real-time validation
  percentInput.addEventListener('input', function(e) {
    let value = e.target.value;
    const originalValue = e.target.value;
    
    // Check if value exceeds 99 (only if it's a complete number)
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    
    if (!isNaN(numericValue) && numericValue > 99) {
      // Limit to 99
      e.target.value = '99%';
      showValidationMessage('Maximum rebate percentage is 99%');
    } else if (value && !isNaN(numericValue) && value !== originalValue) {
      // Only add % if user is typing new content, not when deleting
      // Check if the change was an addition (not deletion) by comparing lengths
      const wasAddition = value.length > originalValue.length || 
                         (value.length === originalValue.length && value !== originalValue);
      
      if (wasAddition && !value.includes('%')) {
        e.target.value = value + '%';
      }
    }
  });
  
  // Add keydown event listener to prevent typing invalid characters
  percentInput.addEventListener('keydown', function(e) {
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        (e.keyCode === 90 && e.ctrlKey === true)) {
      return;
    }
    
    // Allow only numbers and decimal point
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105) && e.keyCode !== 190 && e.keyCode !== 110) {
      e.preventDefault();
    }
  });
  
  // Add paste event listener to validate pasted content
  percentInput.addEventListener('paste', function(e) {
    setTimeout(() => {
      let value = e.target.value;
      const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
      
      if (!isNaN(numericValue) && numericValue > 99) {
        e.target.value = '99%';
        showValidationMessage('Maximum rebate percentage is 99%');
      }
      // Don't automatically add % for pasted content - let user decide
    }, 0);
  });
}

// Function to show validation message
function showValidationMessage(message) {
  // Remove existing message if any
  const existingMessage = document.getElementById('rebate-percent-error');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create new message element
  const errorMessage = document.createElement('div');
  errorMessage.id = 'rebate-percent-error';
  errorMessage.style.cssText = `
    color: #ff4444;
    font-size: 12px;
    margin-top: 4px;
    display: block;
  `;
  errorMessage.textContent = message;
  
  // Insert after the input container
  const percentContainer = document.getElementById('rbm-percent');
  if (percentContainer && percentContainer.parentNode) {
    percentContainer.parentNode.insertBefore(errorMessage, percentContainer.nextSibling);
    
    // Auto-remove message after 3 seconds
    setTimeout(() => {
      if (errorMessage.parentNode) {
        errorMessage.remove();
      }
    }, 3000);
  }
}

// Initialize validation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeRebatePercentageValidation();
});

// Also initialize when the modal is opened (in case it's dynamically created)
document.addEventListener('click', function(e) {
  if (e.target && e.target.closest('[data-action="add-rebate"]')) {
    setTimeout(() => {
      initializeRebatePercentageValidation();
    }, 100);
  }
});

// Функция для добавления обработчиков кликов к чипсам дней недели
function addWeekChipsClickHandlers(weekChipsContainer) {
  if (!weekChipsContainer) return;
  
  console.log('Adding click handlers to week chips');
  
  // Удаляем старые обработчики если они есть
  weekChipsContainer.querySelectorAll('.chip').forEach(chip => {
    const newChip = chip.cloneNode(true);
    chip.parentNode.replaceChild(newChip, chip);
  });
  
  // Добавляем новые обработчики
  weekChipsContainer.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Week chip clicked:', chip.dataset.wd);
      
      // Используем функцию setActiveChip если она доступна
      if (window.setActiveChip) {
        window.setActiveChip(chip);
      } else {
        // Fallback к ручной логике
        weekChipsContainer.querySelectorAll('.chip').forEach(c => {
          c.classList.remove('is-active');
          c.setAttribute('aria-selected', 'false');
        });
        
        chip.classList.add('is-active');
        chip.setAttribute('aria-selected', 'true');
        weekChipsContainer.dataset.selectedWd = chip.dataset.wd;
      }
      
      // Обновляем текст с ближайшей выплатой при изменении дня недели
      updateNextPayoutText();
    });
  });
}


