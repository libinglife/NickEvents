# NickEvents - 基于事件驱动的异步、流程控制、垂直模块、轻松耦合、组件通信控制等于一体的解决方案。适用于web前端及nodejs后端。
   1. 事件驱动，一切以事件的形式定义，可以在任意时刻触发事件
   2. 事件组合，轻松的将事件组合或拆分，自动处理依赖关系，比await更方便
   3. 垂直开发，每个事件单元都是独立的不需要任何的嵌套关系，代码是垂直向下而非嵌套的
   4. 组件通信，每一个事件的实例都是一个组件，组件之间通过权限控制进行通信，组件间通信的权限是严格的
   5. 简易易用，API使用非常简单很容易上手
## NickEvents API 
   1. [on](#on)
   2. [once](#once)
   3. [onSuccess](#onSuccess)
   4. [onError](#onError)
   5. [define](#define)
   6. [defineSuccess](#defineSuccess)
   7. [defineError](#defineError)
   8. [message](#message)
   9. [messageOnce](#messageOnce)
   10. [off](#off)
   11. [offDefine](#offDefine)
   12. [emit](#emit)
   13. [emitMessage](#emitMessage)
   14. [events](#events)
   15. [setPermission](#setPermission)
   16. [getPermission](#getPermission)
   17. [send](#send)
   18. [maxListeners](#maxListeners)  
----   
如果你想快速查看NickEvents到底解决什么问题可以先看看最底部的[综合示例](#异步与流程控制)   
如果你觉得[综合示例](#异步与流程控制)无法满足你可以直接移步[组件通信与权限](#组件通信)
## on
### 简单的事件绑定
1. 同一个事件可以绑定多个回调函数
2. 默认一个事件最多可绑定10个回调函数
3. 如果超出最大事件绑定个数会输出警告
4. 最大事件监听数量是可以设置的
```js
    //通过on绑定a事件，通过emit来触发指定的事件，事件可以像函数一样重复执行
    new NickEvents().on('a',()=>{
        console.log('a');
    }).emit('a').emit('a');
```
### 向事件传递参数
```js
    //emit调用事件的时候可以传递任意数量的参数
    new NickEvents().on('a',(next,a,b,c,d)=>{
        //需要注意的是回调函数内的第一个参数永远是next回调函数，后面将介绍它的使用
        console.log(a,b,c,d);
    }).emit('a',1,2,3,4);
```
### 事件依赖
> 如果一个事件需要等待其它事件完成才能触发，那么它们之间就是事件依赖关系  
> 事件依赖一般是自动触发，有点像await，但实现原理和内部机制是完全不同的  
> 事件依赖也是代码模块化，每个事件都可以当作一个模块，模块之间不需要代码的合并嵌套，却可以配合执行
> 事件依赖让代码模块化、垂直化、轻松实现耦合与关联  
> 所有事件绑定的函数，第二参数为数组的话都可以定义依赖关系
### 一个简单的事件依赖
 1. 所有事件的第一个参数都是next函数，next函数的执行用于反馈事件执行结果
 2. next(false)表示事件执行失败  next(true)表示事件执行成功 
 3. next中的第2个及以后的参数都将传递给依赖事件，可以是任意数量和类型
 4. on定义的依赖是全部完成，next第一个参数无所谓是false或true
 5. onSuccess定义的依赖是全部成功，next第一个参数必须是true
 6. onError定义的依赖是全部失败，next第一个参数必须是false
```js
    new NickEvents().on('a',function(next){
        console.log('a')
        next();
    }).on('b',function(next){
        console.log('b');
        next();
    }).on('c',['a','b'],function(next){
        console.log('c')
    }).emit('b').emit('a');
```
### 事件依赖中的参数
```js
    new NickEvents().on('a',next=>{
        next(true,'a1','a2');
    }).on('b',next=>{
        next(false,'b1','b2');
    }).on('c',['a','b'],(next,arg)=>{
        //事件依赖的参数结构是  {a:['a1','a2'],b:['b1','b2']}
        console.log(arg);
    }).emit('b').emit('a');
```
## once
once定义的事件只会执行一次，执行过后自动被删除
```js
    //如下只会输出一次
    new NickEvents().once('a',()=>{
        console.log('a-once');
    }).emit('a').emit('a');
```
## onSuccess
onSuccess定义的事件依赖必须所有依赖的事件执行成功才会触发
```js
    new NickEvents().on('a',next=>{
        next(true);
    }).onSuccess('b',['a'],next=>{
        console.log('b-success')
    }).on('c',next=>{
        next(false);
    }).onSuccess('d',['c'],next=>{
        //不会触发因为c事件中的next参数是false
        console.log('d-success');
    }).emit('a').emit('c');
```
## onError
onError定义的事件依赖必须所有依赖的事件执行失败才会触发
```js
    new NickEvents().on('a',next=>{
        next(false);
    }).onError('b',['a'],next=>{
        console.log('b-error')
    }).emit('a');
```
## define
1. 通过define定义的事件是无法通过off事件进行删除的
2. define定义的事件只有defineOff能删除
3. define类型的事件本意是希望定义一些不可被删除的事件，防止事件被误删，除非使用者清楚并且决定删除这类事件
4. define与on事件在使用上没有任何区别
下面依然可以输出a而b事件则被off删除了
```js
    new NickEvents().define('a',()=>{
        console.log('a');
    }).on('b',()=>{
        console.log('b');
    }).off('a').off('b').emit('a').emit('b');
```
## defineSuccess
1. on开头与define开头的事件绑定方法使用都是一样的
2. on开头与define开头的事件只有一个区别就是define定义的需要defineOff才能删除
```js
    new NickEvents().on('a',next=>{
        next(true);
    }).defineSuccess('b',['a'],next=>{
        console.log('b-success');
    }).emit('a');
```
## defineError
```js
    new NickEvents().on('a',next=>{
        next(false);
    }).defineSuccess('b',['a'],next=>{
        console.log('b-error');
    }).emit('a');
```
## off 
1. off用于删除绑定的事件
2. 注意使用off时如果不指定第二参数则删除整个事件类型
```js
    //删除一个指定的事件
    function b(){
        console.log('a1');
    }
    new NickEvents().on('a',()=>{
        console.log('a2');
    }).on('a',b).off('a',b).emit('a');
```
----
```js
    //删除某个事件类型中所有的事件
    function b(){
        console.log('a1');
    }
    new NickEvents().on('a',()=>{
        console.log('a2');
    }).on('a',b).off('a').emit('a');
```
## offDefine
1. offDefine只能删除通过define开头所绑定的事件
2. offDefine的用法与off一致
```js
    //只能删除define类型的事件
    new NickEvents().on('a',()=>{
        console.log('a1');
    }).define('a',()=>{
        console.log('a2');
    }).offDefine('a').emit('a');
```
## emit
1. emit用于调用指定的事件
2. 不推荐用emit手动调用那些有依赖的事件，因为依赖自动触发和直接emit触发事件得到的参数结构是不一样的
```js
    new NickEvents().on('a',()=>{
        console.log('a');
    }).on('a',()=>{
        console.log('aaa');
    }).emit('a');
```
## events
events方法将返回当前实例注册的所有事件以及每个事件的数量
```js
    const nick = new NickEvents().on('a',()=>{
    }).on('a',()=>{
    }).on('b',()=>{
    }).onSuccess('a',()=>{
    });
    console.log(nick.events());
    //将输出的结果是 {"a" => 3, "b" => 1}
```
## 组件通信
1. 每一个NickEvents的实例都是一个对象或者组件，组件或对象都只是个称呼而已
2. 每一个事件组件都是独立的且互不干扰的，各自负责不同的业务逻辑
3. 让两个独立的组件通信需要严格的控制，这样才不会扰乱其它组件的业务逻辑
4. 组件通信的权限是双向配置的，而且是白名单机制！
5. 组件可以定义只接收哪个组件中哪个事件的消息，也可以定义只能向哪个组件中的哪个事件发送消息
6. 只有发送方和接收方的权限校验都通过了才能完成通信！！！
7. 如果未通过权限校验则会触发perssion-debug事件，谁阻止了事件谁将触发此事件，如果双方都拒绝则都会触发此事件
8. 通信的事件只能通过message来绑定，如果有依赖也只能是message类型的事件
9. 当组件需要通信的时候这个组件必须指定不重复的名称进行标识
10. 在通信消息发送前需要先配置权限，否则无法发送
### 组件通信三步走
1. 首先实例化的对象需要指定name，如果出现则会输出警告
2. 接收方和发送方都需要先配置权限
3. 通过send方法向指定的组件发送消息
## setPermission
权限配置
```js
    //先创建两个不同名称的组件
    const nick = new NickEvents({name:'nick'});
    const cct = new NickEvents({name:'cct'});  
    //nick的权限配置  
    nick.setPermission({
        //from定义来源的访问权限，即哪些组件可以访问组件中的哪些事件
        from:{
            //以下表示cct可以访问当前组件的nick-1事件
            //但nick-2事件是false表示拒绝
            //未出现在配置中的事件一律是拒绝的
            cct:{
                'nick-1':true,
                'nick-2':false
            }
        },
        //to定义对其它组件的访问权限，即我可以访问哪些组件的哪些事件
        to:{
            //以下表示只能访问cct组件
            //只能访问cct-1事件
            //cct-2是拒绝的
            cct:{
                'cct-1':true,
                'cct-2':false
            }
        }
    });
    //cct组件的权限配置
    cct.setPermission({
        from:{
            nick:{
                'cct-1':true,
                'cct-2':false
            }
        },
        to:{
            nick:{
                'nick-1':false,
                'nick-2':false
            }
        }
    });
    //nick绑定通信事件
    nick.message('nick-1',(next,{from,to,type,time,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 发送数据：`,data);
    }).message('nick-2',(next,{from,to,type,time,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 发送数据：`,data);
    }).message('permission-debug',(next,{from,to,type,time,denied,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 拒绝原因${denied}`,data);
    });
    //为cct绑定通信事件
    cct.message('cct-1',(next,{from,to,type,time,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 发送数据：`,data);
    }).message('cct-2',(next,{from,to,type,time,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 发送数据：`,data);
    }).message('permission-debug',(next,{from,to,type,time,denied,data})=>{
        console.log(`发送方${from} 接收方${to} 执行事件${type} 发送时间${time} 拒绝原因${denied}`,data);
    });
```
## send
```js
    //让nick调用cct的事件,以下只有cct-1事件执行了，因为cct-2事件双方的权限配置都是拒绝的
    nick.send({
        to:{
            cct:['cct-1','cct-2'],
            data:'nick传递来的数据'
        }
    });
    //让cct调用nick的事件,nick-2是双方都拒绝的，而nick-1是cct自己拒绝的
    cct.send({
        to:{
            nick:['nick-1','nick-2'],
            data:'cct传递来的数据'
        }
    });
```
## 高级权限配置
1. 只用false true来控制访问权限是不是太草率了？
2. 那么我们来点高级的，如果事件权限配置的值不是布尔值是回调函数，那么将会执行回调函数对发送的数据进行检验，只有返回true的时候才允许调用事件
```js
    //以下示例send数据为8的未能触发
    new NickEvents({name:'nick'}).setPermission({
        from:{
            cct:{
                fn1:data=>data>10
            }
        }
    }).message('fn1',(next,{from,data})=>{
        console.log(`来源${from} 数据：`,data);
    });

    new NickEvents({name:'cct'}).setPermission({
        to:{
            nick:{
                fn1:data=>typeof data === 'number'
            }
        }
    }).send({
        to:{
            nick:['fn1']
        },
        data:11
    }).send({
        to:{
            nick:['fn1']
        },
        data:8
    });
```
## getPermisson
通过getPermisson可以查看当前组件已经配置的权限
```js
    const nick = new NickEvents({name:'nick'}).setPermission({
        from:{
            cct:{
                fn1:data=>data>10,
                fn2:true,
                fn3:data=>data.length>10
            }
        },
        to:{
            a:true,
            b:true,
            c:data=>typeof data === 'string'
        }
    });
    console.log(nick.getPermission);
```
## maxListeners
1. 在实例化事件对象的时候还可以通过maxListeners参数设置每个事件绑定回调函数的最大数量
2. 默认maxListeners为10
```js
    //以下将输出The number of 'a' event bound listeners exceeds the maximum 1 limit.
    new NickEvents({maxListeners:1}).on('a',()=>{

    }).on('a',()=>{

    });
```
## 异步与流程控制
1. 我们不必去想这些代码到底做了什么，因此代码非常简单没有复杂的语句和逻辑
2. 注意step4 step5 try-agin三个事件都依赖step3，简单的说都是在等待step3完成才会执行
3. next()中的是0-1的随机数，0表示失败1表示成功，也就是产生了随机的成功或失败的状态
4. 如果step3成功了那么step5就会触发，也就是结束了
5. 如果step3失败了那么try-agin就会触发，然后又会重新执行init直到step3出现成功整个流程才会结束
6. 而不管step3成功还是失败都会执行step4
```js
    new NickEvents().on('step-1',next=>{
        setTimeout(()=>{
            console.log('step-1');
            next( parseInt(Math.random()*2) );
        },Math.random()*2000);
    }).on('step2',['step-1'],function(){
        setTimeout(()=>{
            console.log('step-2');
            this.emit('step-3');
        },Math.random()*2000);
    }).on('step-3',next=>{
        setTimeout(()=>{
            console.log('step-3');
            next( parseInt(Math.random()*2) );
        },Math.random()*2000);
    }).on('step-4',['step-3'],next=>{
        console.log('step-4');
    }).onSuccess('step-5',['step-3'],next=>{
        console.log('end');
    }).onError('try-agin',['step-3'],function(){
        console.log('try-agin...');
        this.emit('init');
    }).on('init',function(){
        this.emit('step-1');
    }).emit('init');
```
   



