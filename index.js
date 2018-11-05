/**
 * @author cuichuanteng 崔传腾
 * @version 1.0.0 
 * @email 401541212@qq.com
 */
class NickEventsPermission {
    constructor() {
        const events = new Map();
        this.addEvent = this.addEvent({ events });
        this.setPermission = this.setPermission({ events });
        this.getPermission = this.getPermission({ events });
        this.send = this.send({ events });
    }
    addEvent({ events }) {
        return (name, event) => {
            if (name && !events.get(name)) {
                const eventsPermission = new Map(Object.entries({ event, from: new Map(), to: new Map() }));
                events.set(name, eventsPermission);
            } else if(name){
                console.warn(`Event object with ${name} name already exists`);
            }
            return this;
        }
    }
    setPermission({ events }) {
        return ({ name, from = {}, to = {} } = {}) => {
            const eventsPermission = events.get(name);
            for (let [event, value] of Object.entries(from)) {
                from[event] = new Map(Object.entries(value));
            }
            for (let [event, value] of Object.entries(to)) {
                to[event] = new Map(Object.entries(value));
            }
            if (eventsPermission) {
                eventsPermission.set('from', new Map([...eventsPermission.get('from'), ...Object.entries(from)]));
                eventsPermission.set('to', new Map([...eventsPermission.get('to'), ...Object.entries(to)]));
            }
            return this;
        }
    }
    getPermission({ events }) {
        return ({ name }) => {
            const eventsPermission = events.get(name);
            if (eventsPermission) {
                const from = eventsPermission.get('from');
                const to = eventsPermission.get('to');
                return new Map([['from', new Map([...from])], ['to', new Map([...to])]])
            }
            return;
        }
    }
    send({ events }) {
        return ({ from, to, data }) => {
            let fromPermission = events.get(from);
            if (fromPermission) {
                let fromEvent = fromPermission.get('event');
                fromPermission = fromPermission.get('to');
                for (let [name, eventsList] of Object.entries(to)) {
                    let toPermissionMap = events.get(name);
                    let fromPermissionMap = fromPermission.get(name);
                    if (toPermissionMap && fromPermissionMap) {
                        let toEvent = toPermissionMap.get('event');
                        toPermissionMap = toPermissionMap.get('from').get(from);
                        if (toPermissionMap) {
                            eventsList.forEach(event => {
                                const toDataFilterRule = toPermissionMap.get(event);
                                const fromDataFilterRule = fromPermissionMap.get(event);
                                const toDataFilterRuleResult = toDataFilterRule === true || (typeof toDataFilterRule === 'function' && toDataFilterRule(data) === true);
                                const fromDataFilterRuleResult = fromDataFilterRule === true || (typeof fromDataFilterRule === 'function' && fromDataFilterRule(data) === true);
                                if (fromDataFilterRuleResult && toDataFilterRuleResult) {
                                    toEvent.emitMessage(event, { from, to: name, type: event, time: Date.now(), data });
                                } else {
                                    const denied = !fromDataFilterRuleResult && !toDataFilterRuleResult ? 'all' : !fromDataFilterRuleResult ? 'from' : 'to';
                                    if (!fromDataFilterRuleResult) {
                                        fromEvent.emitMessage('permission-debug', { from, to: name, type: event, denied, time: Date.now(), data });
                                    }
                                    if (!toDataFilterRuleResult) {
                                        toEvent.emitMessage('permission-debug', { from, to: name, type: event, denied, time: Date.now(), data });
                                    }
                                }
                            });
                        }
                    }
                }
            }
            return this;
        }
    }
}
const eventsPermission = new NickEventsPermission();
class NickEvents {
    constructor({ name = '', maxListeners = 10 } = {}) {
        const events = new Map();
        const eventsDependentHash = new Map();
        maxListeners = parseInt(maxListeners, 10) || 10;
        this.onSuccess = this.on({ events, eventsDependentHash, success: true, maxListeners });
        this.onError = this.on({ events, eventsDependentHash, fail: true, maxListeners });
        this.define = this.on({ events, eventsDependentHash, define: true, maxListeners });
        this.defineSuccess = this.on({ events, eventsDependentHash, define: true, success: true, maxListeners });
        this.defineError = this.on({ events, eventsDependentHash, define: true, fail: true, maxListeners });
        this.message = this.on({ events, eventsDependentHash, maxListeners, message: true });
        this.messageOnce = this.on({ events, eventsDependentHash, maxListeners, message: true, once: true });
        this.once = this.on({ events, eventsDependentHash, maxListeners, once: true });
        this.on = this.on({ events, eventsDependentHash, maxListeners });
        this.emitMessage = this.emit({ events, eventsDependentHash, message: true });
        this.emit = this.emit({ events, eventsDependentHash });
        this.offDefine = this.off({ events, eventsDependentHash, offDefine: true });
        this.off = this.off({ events, eventsDependentHash });
        this.events = this.events({ events });
        this.setPermission = this.setPermission({ eventsPermission, name });
        this.getPermission = this.getPermission({ eventsPermission, name });
        this.send = this.send({ eventsPermission, name });
        eventsPermission.addEvent(name, this);
    }
    setPermission({ eventsPermission, name }) {
        return ({ ...args }) => {
            eventsPermission.setPermission({ name, ...args });
            return this;
        }
    }
    getPermission({ eventsPermission, name }) {
        return () => {
            return eventsPermission.getPermission({ name });
        }
    }
    on({ events, eventsDependentHash, success = false, fail = false, define = false, once = false, message = false, maxListeners = 10 }) {
        return (type, dependent, callback) => {
            callback = typeof dependent === 'function' ? dependent : callback;
            dependent = dependent === callback ? [] : dependent instanceof Array ? dependent : [];
            dependent.sort();
            if (typeof callback === 'function') {
                if (!events.has(type)) {
                    events.set(type, new Set());
                }
                if (!define || events.get(type).size < 1) {
                    let dependentCount = 0;
                    dependent.forEach(event => {
                        event = events.get(event);
                        dependentCount += event ? event.size : 0;
                    });
                    const callbackDepentdent = new Map(Object.entries({ success, callback, fail, once, define, message, dependent, dependentCount, queue: new Set(), args: {}, completeCount: 0, successCount: 0 }));
                    if (dependent.length) {
                        dependent.forEach(event => {
                            if (!eventsDependentHash.get(event)) {
                                eventsDependentHash.set(event, new Map());
                            }
                            eventsDependentHash.get(event).set(type, callbackDepentdent);
                        });
                    }
                    events.get(type).add(callbackDepentdent);
                    if (events.get(type).size > maxListeners) {
                        console.warn(`The number of '${type}' event bound listeners exceeds the maximum ${maxListeners} limit.`);
                    }
                }
            }
            return this;
        }
    }
    emit({ events, eventsDependentHash, message = false }) {
        const $this = this;
        return (type, ...args) => {
            function emit({ type, isDependent = false, isMessage = false, status, args }) {
                if (isDependent) {
                    args = [{ ...args }]
                } else {
                    args = [...args];
                }
                if (type !== 'events-debug') {
                    emit({ type: 'events-debug', args: [type, ...args] });
                }
                args = [(isSuccess, ...args) => {
                    const eventsDependentHashMap = eventsDependentHash.get(type);
                    if (eventsDependentHashMap) {
                        eventsDependentHashMap.forEach((callbackDepentdent, eventType) => {
                            const queue = callbackDepentdent.get('queue');
                            const dependent = callbackDepentdent.get('dependent');
                            const dependentCount = callbackDepentdent.get('dependentCount');
                            const completeCount = callbackDepentdent.get('completeCount') + 1;
                            const successCount = callbackDepentdent.get('successCount') + (isSuccess ? 1 : 0);
                            const dependentArgs = callbackDepentdent.get('args');
                            queue.add(type);
                            dependentArgs[type] = args;
                            if (isSuccess) {
                                callbackDepentdent.set('successCount', successCount);
                            }
                            callbackDepentdent.set('completeCount', completeCount);
                            if (dependentCount === completeCount) {
                                if ([...queue].sort().join() === [...dependent].sort().join()) {
                                    const status = successCount === dependentCount ? 2 : !successCount ? 3 : 1;
                                    emit({ type: eventType, isDependent: true, args: dependentArgs, status, isMessage: message });
                                }
                                callbackDepentdent.set('successCount', 0);
                                callbackDepentdent.set('completeCount', 0);
                                callbackDepentdent.set('args', {});
                                queue.clear();

                            }
                        });
                    }
                }, ...args];
                const eventsQueue = events.get(type);
                if (eventsQueue) {
                    eventsQueue.forEach((callbackDepentdent, index) => {
                        const callback = callbackDepentdent.get('callback');
                        const once = callbackDepentdent.get('once');
                        const define = callbackDepentdent.get('define');
                        const success = callbackDepentdent.get('success');
                        const fail = callbackDepentdent.get('fail');
                        const message = callbackDepentdent.get('message');
                        if (message !== isMessage || (isDependent && ((success && status !== 2) || (fail && status !== 3)))) {
                            return;
                        }
                        callback.bind($this)(...args);
                        if (once && !define) {
                            eventsQueue.delete(callbackDepentdent);
                        }
                    });
                }
            }
            emit({ type, args, isMessage: message });
            return this;
        }
    }
    off({ events, offDefine = false, eventsDependentHash }) {
        return (type, callback) => {
            const eventsQueue = events.get(type);
            if (eventsQueue) {
                eventsQueue.forEach(callbackDepentdent => {
                    const eventCallback = callbackDepentdent.get('callback');
                    const define = callbackDepentdent.get('define');
                    if ((callback && callback !== eventCallback) || (define !== offDefine)) {
                        return;
                    }
                    eventsQueue.delete(callbackDepentdent);
                });
            }
            if (!eventsQueue.size) {
                eventsDependentHash.forEach((callbackDepentdent, eventType) => {
                    if (type === eventType) {
                        eventsDependentHash.delete(type);
                    }
                });
                events.delete(type);
            }
            return this;
        }
    }
    events({ events }) {
        return () => {
            const result = new Map();
            events.forEach((events, type) => {
                result.set(type, events.size);
            });
            return result;
        }
    }
    send({ eventsPermission, name }) {
        return ({ to, data } = {}) => {
            eventsPermission.send({ from: name, to, data });
            return this;
        }
    }
}
//module.exports = NickEvents;
export default NickEvents;