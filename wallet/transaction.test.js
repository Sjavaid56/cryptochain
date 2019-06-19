const Transaction = require('./transaction')
const Wallet = require('./index')
const {verifySignature} = require('../util');
const {REWARD_INPUT, MINING_REWARD} = require('../config')
describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;
    
    beforeEach(() => {
        senderWallet = new Wallet()
        recipient = 'recipient-public-key'; 
        amount = 50;
        transaction = new Transaction({senderWallet, recipient, amount});
    });

it('has an `id`',() => {
    expect(transaction).toHaveProperty('id');
    });
    
    describe('outputMap', () => {
        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap');
        })
        it('outputs the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        })

        it('outputs the remaining the balance for the `senderWallet', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
            .toEqual(senderWallet.balance - amount); 
        })
    })
    describe("input", () => {
        it("has an  `input`", () => {
            expect(transaction).toHaveProperty('input')
        })
        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        })
        it('sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance)
        })
        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        })
        it('signs the input', () => {
            expect(
            verifySignature({
                publicKey: senderWallet.publicKey,
                data: transaction.outputMap,
                signature: transaction.input.signature
            })
            ).toBe(true)
    })
  })
  describe("valiedtransaction()",() => {
      
    let errorMock = jest.fn();
  
    beforeEach(() => {

        errorMock = jest.fn()
        global.console.error = errorMock

    })

      describe("when the tranction is valied", () => {
          it('returns ture', () => {
              expect(Transaction.validTransaction(transaction)).toBe(true)
          })
      })
      describe("when the tranction is not valied", () => {
          describe("and a thranction outputmap value is invalied", () => {
              it('returns false and logs an error', () => {
                  transaction.outputMap[senderWallet.publicKey] = 999999;
                  expect(Transaction.validTransaction(transaction)).toBe(false)
                  expect(errorMock).toHaveBeenCalled();
              })
          })
          describe("and the tractions input signature is invalied", () => {
              it('returns false and logs error', () => {
                transaction.input.signature = new Wallet().sign('data')

                  expect(Transaction.validTransaction(transaction)).toBe(false)
                  expect(errorMock).toHaveBeenCalled();
              })

          })
    
      })
      
    })

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount

        describe("The amount is invalied" , () => {

            it("throws an error", () => {
                expect(() => {
            transaction.update({
            senderWallet, recipient: 'foo', amount: 999999
                    })

                }).toThrow('amount exceeds balance')
            })

        });
    });

        describe("and then amount is valid ", () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = "next-recipient";
                nextAmount = 50; 
    
                transaction.update({senderWallet, recipient: nextRecipient, amount: nextAmount})
        })
            it('outputs the amount to the next reciepent', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount)
    
                });
    
    
            it('subtracts the amount from the original sender outout amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount)
               
    
            });
    
            it('mantains the total output that matches the input amount', () => {
                expect(
                Object.values(transaction.outputMap)
                .reduce((total, outputAmount) => total + outputAmount)
                ).toEqual(transaction.input.amount)
    
            })
            it('re-seigns the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature)
    
    
            }) 

        describe("and another update for the same reciepent", () => {
            addedAmount = 80; 

            beforeEach(() => {
                transaction.update({
                    senderWallet, recipient: nextRecipient, amount: addedAmount
                });
            });
        it("adds to the receipent amount", () => {
            expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount); 
        })
        it('subtracts the amount from the original sender output amount', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
            .toEqual(originalSenderOutput - nextAmount - addedAmount)
        })
    }) 

 })

 describe('rewardTransaction()', () =>{
     let rewardTransaction, minerWallet;

     beforeEach(() => {
         minerWallet = new Wallet();
         rewardTransaction = Transaction.rewardTransaction({minerWallet});
     })

 it('creates a transaction with the reward input', () => {
     expect(rewardTransaction.input).toEqual(REWARD_INPUT);

 })

 it("creates one transaction for the miner with the mining reward", () => {
     expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
 })
})

})