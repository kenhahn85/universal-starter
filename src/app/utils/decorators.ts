import {BaseService} from '../fake.service';

function displayFunction(constructorName: string, propertyKey: string) {
  return constructorName + "#" + propertyKey;
}

function logAction(constructorName: string, propertyKey: string, ...args: any[]) {
  console.log('ACTION:', displayFunction(constructorName, propertyKey) + '(' + args.join(', ') + ')');
}

export function Action(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const orig = descriptor.value;
  descriptor.value = function (...args: any[]) {
    logAction(target.constructor.name, propertyKey, ...args);
    return orig.call(this, ...args);
  };
}

export function Override(target, name) {
  if (Object.getPrototypeOf(target)[name] === undefined) {
    throw new Error(`${name} does not override a member of its superclass`);
  }
}

export function TODO(todoMsg: string, onExec: boolean = false) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    function displayWarning() {
      console.warn("Open TODO on " + displayFunction(target.constructor.name, propertyKey) + ": " + todoMsg);
    }
    
    if (onExec) {
      const orig = descriptor.value;
      descriptor.value = function (...args: any[]) {
        displayWarning();
        return orig.call(this, ...args);
      };
    } else {
      displayWarning();
    }
  };
}
