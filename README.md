# HotEmitter
在偶然中我见识了神奇的[RxJS](https://github.com/Reactive-Extensions/RxJS)，并且被Push的流惊艳了，“居然能有这样的操作，能把看似单次发生的事件变成了流”，同时我也对RxjS的复杂度感到苦恼。
于是我专门针对Observable的Push流写了个小类库，企图以小见大，窥探Reactive Extensions的奥妙。
  
# Push
在RxJS中，由Observable对象Push的流数据结构，有开始(cold或hot)，有结束(complete或error)，next控制着数据流动。在流的性质上与ES6内置的Generator无异，只不过Generator是Pull的。        
将流看作是数组，可以进行一般化的聚合(reduce...),投影(map...),过滤(filter...)等等操作，Observable同样也具备这些功能，甚至扩展了更多常用的函数。    
可是由于拥有更多的细节，RxJS变得更加复杂，学习曲线显得略为陡峭。    

# 不存在开始和结束的HotEmitter
使用getEmitter可以创建emitter对象。     
``` javascript
var [emit,line]=getEmitter();
//...
var receiver=function(value){
    //...
};
line.connect(receiver);
//...
emit(value);
``` 
emit是一个函数，用于发送信号,line相当于传输信号的导线。     
HotEmitter核心设计思想也是Push的流，但它不存在开始和结束的状态，由emit推动的流可以视为一个漫长的流中的一段。     
因此我们不用担心数据是cold还是hot的，他总是hot的，总是能够多播。     
由于HotEmitter的Push流不存在开始和结束，它将不能拥有聚合函数以及一些跟流元素位置相关的函数（如slice)。     
所以，HotEmitter对流的操作函数只有filter，map，scan，merge以及zip。虽然数量少，但是囊括了应有的流操作特性，这会让HotEmitter变得简单。     

# 专注于Push流
专注于Push流，在基本函数emit，connect和disconnect的基础上，我只扩展了上文的5个函数。HotEmitter目前只具备这么点功能，所以是一个非常简单小巧的类库呢。

# 用法介绍。
一、getEmitter函数返回emit和line两个属性。    
二、emit函数每次能发送一个数据。    
三、对line使用流操作函数可以创建新的line。    
四、使用line.connect函数绑定receiver，捕获emit函数发送的数据。    
五、line.connect绑定receiver时会返回disconnect函数，使用disconnect函数可以取消绑定receiver。    

一个简单的[demo](https://github.com/Iplaylf2/HotEmit/blob/master/demo.html)

# HotEmitter的重构
用法基本没变，api甚至只是改了开头字母。  
把一些代码结构改为比较友善的class。  
增加了很重要的一个机制，receiver产生的异常不会立刻抛出，只会收集起来，最后在所有receiver都处理完订阅才抛出。这一点跟DOM的addEventListener做法相近，一个观察者能否收到订阅不应被其他观察者影响。  
其实观察者模式应该处理阻塞么？不过目前前端js单线程来看，面对观察者造成的阻塞也是毫无办法的。  
想起ReactiveX调度器可以控制观察者的订阅处理是并发的（多线程的），异步的，还是当前线程的。如果在其他有多线程的平台实现HotEmitter……