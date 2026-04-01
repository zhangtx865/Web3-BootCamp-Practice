const crypto = require('crypto');

// 交易类
class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    // 计算交易的哈希值
    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
            .digest('hex');
    }
}

// 区块类
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    // 计算区块的哈希值
    calculateHash() {
        return crypto.createHash('sha256')
            .update(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .digest('hex');
    }

    // 工作量证明 - 挖矿
    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        
        console.log(`开始挖矿...`);
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        console.log(`区块已挖出! 哈希值: ${this.hash}`);
    }
}

// 区块链类
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4; // 设置难度为4个0
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.nodes = new Set(); // 存储其他节点
    }

    // 创建创世区块
    createGenesisBlock() {
        return new Block(Date.now(), [], '0');
    }

    // 获取最新区块
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // 添加待处理交易
    createTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    // 挖掘待处理交易
    minePendingTransactions(miningRewardAddress) {
        // 创建包含所有待处理交易的新区块
        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        
        // 挖矿以满足难度要求
        block.mineBlock(this.difficulty);
        
        console.log('区块成功挖出!');
        this.chain.push(block);
        
        // 重置待处理交易列表并发送挖矿奖励
        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];

        // 通知其他节点
        this.broadcastNewBlock();
    }

    // 获取地址余额
    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    // 验证区块链的完整性
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // 验证当前区块的哈希值
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            // 验证区块链接
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }

    // 添加节点
    registerNode(nodeUrl) {
        this.nodes.add(nodeUrl);
        console.log(`节点 ${nodeUrl} 已添加到网络`);
    }

    // 广播新区块到所有节点
    broadcastNewBlock() {
        // 在实际应用中，这里应该使用HTTP请求或WebSocket向其他节点发送新区块
        console.log('向所有节点广播新区块');
        this.nodes.forEach(node => {
            console.log(`发送区块到节点: ${node}`);
            // 这里应该有实际的网络通信代码
        });
    }

    // 接收新区块
    receiveNewBlock(newBlock, senderNodeUrl) {
        const latestBlock = this.getLatestBlock();
        
        // 验证新区块的previousHash是否指向我们的最新区块
        if (newBlock.previousHash !== latestBlock.hash) {
            console.log('拒绝区块: previousHash不匹配');
            return false;
        }
        
        // 验证新区块的哈希值是否满足难度要求
        if (newBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join('0')) {
            console.log('拒绝区块: 工作量证明无效');
            return false;
        }
        
        // 添加新区块到链中
        this.chain.push(newBlock);
        console.log(`接受来自节点 ${senderNodeUrl} 的新区块`);
        
        // 更新待处理交易
        this.pendingTransactions = this.pendingTransactions.filter(t => 
            !newBlock.transactions.some(bt => 
                bt.fromAddress === t.fromAddress && 
                bt.toAddress === t.toAddress && 
                bt.amount === t.amount
            )
        );
        
        return true;
    }

    // 解决链冲突 - 共识算法
    resolveConflicts(chains) {
        let maxLength = this.chain.length;
        let newChain = null;

        // 寻找最长的有效链
        for (const chain of chains) {
            if (chain.length > maxLength && this.isValidChain(chain)) {
                maxLength = chain.length;
                newChain = chain;
            }
        }

        // 如果找到了更长的有效链，替换当前链
        if (newChain) {
            this.chain = newChain;
            console.log('链已替换为更长的链');
            return true;
        }

        console.log('当前链已是最长链');
        return false;
    }

    // 验证提供的链是否有效
    isValidChain(chain) {
        // 检查创世区块
        if (JSON.stringify(chain[0]) !== JSON.stringify(this.createGenesisBlock())) {
            return false;
        }

        // 验证链中的每个区块
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const previousBlock = chain[i - 1];

            if (block.previousHash !== previousBlock.hash) {
                return false;
            }

            if (block.hash !== block.calculateHash()) {
                return false;
            }
        }

        return true;
    }
}

// 使用示例
function runDemo() {
    // 创建区块链实例
    const myCoin = new Blockchain();
    console.log('创建区块链...');

    // 创建一些交易
    console.log('创建交易...');
    myCoin.createTransaction(new Transaction('address1', 'address2', 100));
    myCoin.createTransaction(new Transaction('address2', 'address1', 50));

    // 挖矿
    console.log('开始挖矿...');
    myCoin.minePendingTransactions('miner-address');

    // 查看矿工余额
    console.log(`矿工余额: ${myCoin.getBalanceOfAddress('miner-address')}`);

    // 再创建一些交易
    myCoin.createTransaction(new Transaction('address1', 'address2', 200));
    myCoin.createTransaction(new Transaction('address2', 'address1', 100));

    // 再次挖矿
    console.log('再次挖矿...');
    myCoin.minePendingTransactions('miner-address');

    // 再次查看矿工余额
    console.log(`矿工余额: ${myCoin.getBalanceOfAddress('miner-address')}`);

    // 验证区块链
    console.log(`区块链是否有效: ${myCoin.isChainValid()}`);

    // 打印整个区块链
    console.log(JSON.stringify(myCoin, null, 4));
}

// 运行演示
runDemo();

// 导出类以便其他文件使用
module.exports = { Blockchain, Block, Transaction };