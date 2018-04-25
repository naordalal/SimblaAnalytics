var utils = require('../routes/dashboard')

var data1 = [
    {
    url : 'http://google.com',
    quantity : 10
    },
    {
      url : 'http://facebook.com',
        quantity : 15
    },
    {
        url : '123',
        quantity : 50505
    }]

var data2 = [
    {
        url : 'file://google.com',
        quantity : 1
    },
    {
        url : 'abchttp.com',
        quantity : 15
    },
    {
        url : 'http://365.com',
        quantity: 2
    }
]

var data3 = []

var expected = 'http://facebook.com';
var actual = utils.getBestURL(data1)

console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
expected = 'http://365.com'
actual = utils.getBestURL(data2)
console.assert(expected == actual ,'Test2 Failed : Expected:' + expected +' , Got: ' +actual)
expected = false
actual = utils.getBestURL(data3)
console.assert(expected == actual ,'Test3 Failed : Expected:' + expected +' , Got: ' +actual)




console.log('All Tests Passed!')

