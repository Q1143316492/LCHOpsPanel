// 测试2048分数存储大小
const scores = [0, 2048, 50000, 1000000, 999999999];

console.log('2048游戏分数存储空间分析:');
console.log('================================');

scores.forEach(score => {
    const data = { 'lchOpsPanel.game2048.bestScore': score };
    const jsonString = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
    
    console.log(`分数: ${score.toLocaleString().padStart(10)} | 存储: ${sizeBytes} bytes | JSON: ${jsonString}`);
});

console.log('\n结论:');
console.log('- 即使是极高的分数(9.99亿)，也只占用约41字节');
console.log('- 这相当于几十个字符的文本');
console.log('- 完全不用担心空间占用问题！');
