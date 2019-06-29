const array1 = [
    { start: 236, end: 434 },
    { start: 551, end: 599 },
    { start: 663, end: 688 },
    { start: 710, end: 742 },
    { start: 904, end: 948 },
    { start: 971, end: 1034 }
];

const array2 = [
    { start: 23, end: 46 },
    { start: 300, end: 400 },
    { start: 500, end: 560 },
    { start: 710, end: 742 },
    { start: 904, end: 948 },
    { start: 971, end: 1034 }
];

mergerRange = (allRanges, length) => {
    const list = new Array(length);
    allRanges.forEach(ranges =>
        ranges.forEach(range => {
            for (let i = range.start; i <= range.end; i++) {
                list[i] = true;
            }
        })
    );
    getNewRange = () => {
        const newRange = [];
        let start;
        let end;
        let pre;
        for (let i = 0; i <= list.length; i++) {
            if (list[i] !== pre) {
                if (list[i]) {
                    start = i;
                } else {
                    end = i-1;
                    newRange.push({ start: start, end: end });
                }
                pre = list[i];
            }
        }
        return newRange;
    };
    return getNewRange();
};

let array3 = mergerRange([array1, array2]);

console.log(array3);
