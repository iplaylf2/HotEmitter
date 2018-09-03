# HotEmit
本类库相当于弱化了N^N倍的[RxJS](https://github.com/Reactive-Extensions/RxJS) 
  
# Push

在RxJS中，Observable相当于Push的流，与ES6内置对象Generator的Pull流有所不同。   
Observable的Push流，有开始(cold或hot)，有结束(complete或error)，由next控制数据流动。在流的性质上与Generator无异。    
将流看作是数组，可以进行一般化的聚合(reduce...),投影(map...),过滤(filter...)等等操作，Observable因此也具备这些功能，甚至扩展了更多常用的函数。    
可是也由于功能的强大，RxJS变得更加复杂，学习曲线更陡峭。    

# 不存在开始和结束的HotEmit
使用GetEmitter可以创建emitter对象。     
``` javascript
var [emit,line]=GetEmitter();
//...
var action=function(value){
    //...
};
line.connect(action);
//...
emit(value);
``` 
emit是一个函数，用于发送信号,line相当于传输信号的导线。     
HotEmit也是基于Push流设计的，但它不存在开始和结束的状态，由emit推动的Push流可以视为一个漫长的流中的一段。     
因此我们不用担心数据是cold还是hot的，他总是hot的。     
没有cold数据是对比RxJS的第一个简化。     
由于HotEmit的Push流不存在开始和结束，因此它不能拥有聚合函数以及一些跟流元素位置相关的函数（如slice)。     
所以，HotEmit对流的操作函数只有filter，map，scan，Merge以及Zip。     
流操作函数的先天不足是对比RxJS的第二个简化。    

# 专注于Push流
专注于Push流，在基本函数emit，connect和disconnect的基础上，我只扩展了上文的5个函数。HotEmit目前只具备这么点功能，所以是一个非常简单小巧的类库呢。

# 用法介绍。
一、GetEmitter函数返回emit和line。    
二、emit每次发送一个数据，推动Push流流动(Emmmm...)。    
三、对line使用流操作函数创建新的line。    
四、使用line.connect函数绑定action，捕获emit函数发送的数据。    
五、line.connect绑定action时会返回disconnect函数，使用disconnect函数可以取消绑定action。    

[demo](https://github.com/Iplaylf2/HotEmit/blob/master/demo.html)