const visCanvas = document.getElementById('vis-canvas');
if (visCanvas) {
    const algoSelect = document.getElementById('algo-select');
    const speedSelect = document.getElementById('speed-select');
    const customArrayInput = document.getElementById('custom-array');
    const searchTargetInput = document.getElementById('search-target');
    const generateBtn = document.getElementById('generate-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    let arrayElements = [];
    let arrayValues = [];
    let isSorting = false;
    let isPaused = false;
    let abortController = new AbortController();

    const SPEED_MAP = { slow: 800, medium: 200, fast: 50 };
    function getSpeed() { return SPEED_MAP[speedSelect.value] || 200; }

    async function sleep(ms) {
        return new Promise(resolve => {
            const checkPause = setInterval(() => {
                if (abortController.signal.aborted) {
                    clearInterval(checkPause);
                    resolve();
                } else if (!isPaused) {
                    clearInterval(checkPause);
                    setTimeout(resolve, ms);
                }
            }, 50);
        });
    }

    function generateArray(customValues = null) {
        visCanvas.innerHTML = '';
        arrayElements = [];
        arrayValues = [];

        if (customValues) {
            arrayValues = customValues.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
        }

        if (arrayValues.length === 0) {
            const size = window.innerWidth < 768 ? 15 : 25;
            for (let i = 0; i < size; i++) {
                arrayValues.push(Math.floor(Math.random() * 80) + 10);
            }
        }

        const maxVal = Math.max(...arrayValues, 100);

        arrayValues.forEach(val => {
            const bar = document.createElement('div');
            bar.classList.add('vis-bar');
            bar.style.height = `${(val / maxVal) * 90}%`;
            bar.innerText = arrayValues.length > 30 ? '' : val;

            visCanvas.appendChild(bar);
            arrayElements.push(bar);
        });
    }

    generateBtn.addEventListener('click', () => {
        if (isSorting) return;
        generateArray(customArrayInput.value);
    });

    algoSelect.addEventListener('change', () => {
        const isSearch = ['linear', 'binary'].includes(algoSelect.value);
        if (isSearch) searchTargetInput.classList.remove('hide');
        else searchTargetInput.classList.add('hide');

        if (!isSorting) generateArray();
    });

    resetBtn.addEventListener('click', () => {
        abortController.abort();
        abortController = new AbortController();
        isSorting = false;
        isPaused = false;
        pauseBtn.textContent = 'Pause';
        generateArray(customArrayInput.value);
    });

    pauseBtn.addEventListener('click', () => {
        if (!isSorting) return;
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    });

    async function swap(i, j) {
        if (abortController.signal.aborted) return;
        arrayElements[i].classList.add('swapped');
        arrayElements[j].classList.add('swapped');

        await sleep(getSpeed());

        const tempHeight = arrayElements[i].style.height;
        const tempText = arrayElements[i].innerText;
        arrayElements[i].style.height = arrayElements[j].style.height;
        arrayElements[i].innerText = arrayElements[j].innerText;
        arrayElements[j].style.height = tempHeight;
        arrayElements[j].innerText = tempText;

        const tempVal = arrayValues[i];
        arrayValues[i] = arrayValues[j];
        arrayValues[j] = tempVal;

        await sleep(getSpeed());

        arrayElements[i].classList.remove('swapped');
        arrayElements[j].classList.remove('swapped');
    }

    async function bubbleSort() {
        for (let i = 0; i < arrayValues.length; i++) {
            for (let j = 0; j < arrayValues.length - i - 1; j++) {
                if (abortController.signal.aborted) return;
                arrayElements[j].classList.add('comparing');
                arrayElements[j + 1].classList.add('comparing');

                await sleep(getSpeed());
                if (arrayValues[j] > arrayValues[j + 1]) await swap(j, j + 1);

                arrayElements[j].classList.remove('comparing');
                arrayElements[j + 1].classList.remove('comparing');
            }
            arrayElements[arrayValues.length - 1 - i].classList.add('sorted');
        }
    }

    async function selectionSort() {
        for (let i = 0; i < arrayValues.length; i++) {
            let minIdx = i;
            arrayElements[i].classList.add('active');
            for (let j = i + 1; j < arrayValues.length; j++) {
                if (abortController.signal.aborted) return;
                arrayElements[j].classList.add('comparing');
                await sleep(getSpeed());
                if (arrayValues[j] < arrayValues[minIdx]) {
                    if (minIdx !== i) arrayElements[minIdx].classList.remove('active');
                    minIdx = j;
                    arrayElements[minIdx].classList.add('active');
                }
                arrayElements[j].classList.remove('comparing');
            }
            if (minIdx !== i) await swap(i, minIdx);
            arrayElements[minIdx].classList.remove('active');
            arrayElements[i].classList.add('sorted');
        }
    }

    async function insertionSort() {
        for (let i = 1; i < arrayValues.length; i++) {
            let j = i;
            while (j > 0 && arrayValues[j - 1] > arrayValues[j]) {
                if (abortController.signal.aborted) return;
                arrayElements[j].classList.add('comparing');
                arrayElements[j - 1].classList.add('comparing');

                await sleep(getSpeed());
                await swap(j, j - 1);

                arrayElements[j].classList.remove('comparing');
                arrayElements[j - 1].classList.remove('comparing');
                j--;
            }
            arrayElements[i].classList.add('sorted');
        }
        arrayElements[0].classList.add('sorted');
    }

    async function mergeSort(start, end) {
        if (start >= end || abortController.signal.aborted) return;
        const mid = Math.floor((start + end) / 2);
        await mergeSort(start, mid);
        await mergeSort(mid + 1, end);
        await merge(start, mid, end);
    }

    async function merge(start, mid, end) {
        let n1 = mid - start + 1;
        let n2 = end - mid;
        let leftArr = new Array(n1), rightArr = new Array(n2);
        for (let i = 0; i < n1; i++) leftArr[i] = arrayValues[start + i];
        for (let j = 0; j < n2; j++) rightArr[j] = arrayValues[mid + 1 + j];

        let i = 0, j = 0, k = start;
        const maxVal = Math.max(...arrayValues, 100);

        while (i < n1 && j < n2) {
            if (abortController.signal.aborted) return;
            arrayElements[k].classList.add('comparing');
            await sleep(getSpeed());

            let val = (leftArr[i] <= rightArr[j]) ? leftArr[i++] : rightArr[j++];
            arrayValues[k] = val;
            arrayElements[k].style.height = `${(val / maxVal) * 90}%`;
            arrayElements[k].innerText = arrayValues.length > 30 ? '' : val;

            arrayElements[k].classList.remove('comparing');
            arrayElements[k].classList.add('swapped');
            await sleep(getSpeed());
            arrayElements[k].classList.remove('swapped');
            k++;
        }
        while (i < n1 || j < n2) {
            if (abortController.signal.aborted) return;
            let val = (i < n1) ? leftArr[i++] : rightArr[j++];
            arrayValues[k] = val;
            arrayElements[k].style.height = `${(val / maxVal) * 90}%`;
            arrayElements[k].innerText = arrayValues.length > 30 ? '' : val;
            k++;
            await sleep(getSpeed());
        }
    }

    async function quickSort(left, right) {
        if (left >= right || abortController.signal.aborted) {
            if (left >= 0 && left < arrayElements.length) arrayElements[left].classList.add('sorted');
            return;
        }
        const pivotIdx = await partition(left, right);
        arrayElements[pivotIdx].classList.add('sorted');
        await quickSort(left, pivotIdx - 1);
        await quickSort(pivotIdx + 1, right);
    }

    async function partition(left, right) {
        let pivot = arrayValues[right];
        arrayElements[right].classList.add('active');
        let i = left - 1;
        for (let j = left; j < right; j++) {
            if (abortController.signal.aborted) return;
            arrayElements[j].classList.add('comparing');
            await sleep(getSpeed());
            if (arrayValues[j] < pivot) {
                i++;
                if (i !== j) await swap(i, j);
            }
            arrayElements[j].classList.remove('comparing');
        }
        await swap(i + 1, right);
        arrayElements[right].classList.remove('active');
        return i + 1;
    }

    async function linearSearch() {
        const target = parseInt(searchTargetInput.value);
        if (isNaN(target)) return;
        for (let i = 0; i < arrayValues.length; i++) {
            if (abortController.signal.aborted) return;
            arrayElements[i].classList.add('comparing');
            await sleep(getSpeed());
            if (arrayValues[i] === target) {
                arrayElements[i].classList.remove('comparing');
                arrayElements[i].classList.add('active');
                return;
            }
            arrayElements[i].classList.remove('comparing');
            arrayElements[i].classList.add('swapped');
        }
    }

    async function binarySearch() {
        const target = parseInt(searchTargetInput.value);
        if (isNaN(target)) return;

        arrayValues.sort((a, b) => a - b);
        const maxVal = Math.max(...arrayValues, 100);
        for (let i = 0; i < arrayValues.length; i++) {
            arrayElements[i].style.height = `${(arrayValues[i] / maxVal) * 90}%`;
            arrayElements[i].innerText = arrayValues.length > 30 ? '' : arrayValues[i];
        }

        let left = 0, right = arrayValues.length - 1;
        while (left <= right) {
            if (abortController.signal.aborted) return;
            for (let i = 0; i < arrayValues.length; i++) arrayElements[i].classList.remove('comparing', 'swapped');
            for (let i = left; i <= right; i++) arrayElements[i].classList.add('swapped');

            let mid = Math.floor((left + right) / 2);
            arrayElements[mid].classList.remove('swapped');
            arrayElements[mid].classList.add('comparing');

            await sleep(getSpeed() * 2);

            if (arrayValues[mid] === target) {
                arrayElements[mid].classList.remove('comparing');
                arrayElements[mid].classList.add('active');
                return;
            } else if (arrayValues[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }

    startBtn.addEventListener('click', async () => {
        if (isSorting) return;
        isSorting = true;
        abortController = new AbortController();

        arrayElements.forEach(el => el.className = 'vis-bar');

        const algo = algoSelect.value;
        try {
            if (algo === 'bubble') await bubbleSort();
            else if (algo === 'selection') await selectionSort();
            else if (algo === 'insertion') await insertionSort();
            else if (algo === 'merge') {
                await mergeSort(0, arrayValues.length - 1);
                if (!abortController.signal.aborted) arrayElements.forEach(el => el.classList.add('sorted'));
            }
            else if (algo === 'quick') {
                await quickSort(0, arrayValues.length - 1);
                if (!abortController.signal.aborted) arrayElements.forEach(el => el.classList.add('sorted'));
            }
            else if (algo === 'linear') await linearSearch();
            else if (algo === 'binary') await binarySearch();
        } catch (e) {
            console.log("Animation aborted");
        }
        isSorting = false;
    });

    generateArray();
}
