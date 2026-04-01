const crypto = require('crypto');

/**
 * 生成 RSA 密钥对
 * @returns {Object} 包含公钥和私钥的对象
 */
function generateRSAKeyPair() {
    console.log('正在生成 RSA 密钥对...');
    
    // 生成 RSA 密钥对，使用 2048 位长度
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    
    console.log('RSA 密钥对生成完成！');
    return { publicKey, privateKey };
}

/**
 * 使用 SHA-256 挖矿，寻找满足指定前导零数量的哈希值
 * @param {string} prefix - 哈希前缀字符串
 * @param {number} targetZeros - 目标前导零的数量
 * @returns {Object} - 包含耗时、nonce值、哈希内容和哈希值的对象
 */
function mine(prefix, targetZeros) {
    console.log(`开始挖矿，寻找满足 ${targetZeros} 个前导零的哈希值...`);
    
    const target = '0'.repeat(targetZeros);
    console.log(`目标哈希前缀: ${target}`);
    let nonce = 0;
    const startTime = Date.now();
    
    while (true) {
        const content = prefix + nonce;
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        
        if (hash.startsWith(target)) {
            const endTime = Date.now();
            return {
                timeSpent: (endTime - startTime) / 1000, // 转换为秒
                nonce,
                content,
                hash
            };
        }
        
        nonce++;
        
        // 每处理 100 万个 nonce 打印一次进度
        if (nonce % 1000000 === 0) {
            console.log(`已尝试 ${nonce.toLocaleString()} 个 nonce 值...`);
        }
    }
}

/**
 * 使用私钥对数据进行签名
 * @param {string} data - 要签名的数据
 * @param {string} privateKey - 私钥
 * @returns {string} - 签名的十六进制表示
 */
function signData(data, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
}

/**
 * 使用公钥验证签名
 * @param {string} data - 原始数据
 * @param {string} signature - 签名
 * @param {string} publicKey - 公钥
 * @returns {boolean} - 验证是否成功
 */
function verifySignature(data, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
}

function main() {
    // 1. 生成 RSA 密钥对
    const { publicKey, privateKey } = generateRSAKeyPair();
    
    // 2. 使用 POW 算法找到满足条件的哈希值
    const prefix = "zhangtx864";


    const powResult = mine(prefix, 4);

    console.log('\n挖矿结果:');
    console.log(`花费时间: ${powResult.timeSpent.toFixed(2)} 秒`);
    console.log(`Nonce值: ${powResult.nonce}`);
    console.log(`哈希内容: ${powResult.content}`);
    console.log(`哈希值: ${powResult.hash}`);

    // 3. 用私钥对满足条件的哈希内容进行签名
    console.log('\n使用私钥对哈希内容进行签名...');
    const signature = signData(powResult.content, privateKey);
    console.log(`签名结果: ${signature}`);

    // 4. 用公钥验证签名
    console.log('\n使用公钥验证签名...');
    const isValid = verifySignature(powResult.content, signature, publicKey);
    console.log(`签名验证结果: ${isValid ? '验证成功' : '验证失败'}`);

    // 输出密钥信息（实际应用中通常不会这样做）
    console.log('\n密钥信息（仅供参考）:');
    console.log('公钥:');
    console.log(publicKey);
    console.log('私钥:');
    console.log(privateKey);

    
}

main();