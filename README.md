# difun

The easiest way to DI.

## No decorators

The "standard" DI way:

```ts
import { ISSUE_TOKEN } from '@tokens';
class Mental {
    constructor(
        @provide(ISSUE_TOKEN, String)
        private issue: string
    ) {}
}
```

<details>
<summary>which is compiled into actually bad code:</summary>
<p>

```ts
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ISSUE_TOKEN } from '@tokens';
let Mental = class Mental {
    constructor(issue) {
        this.issue = issue;
    }
};
Mental = __decorate([
    __param(0, provide(ISSUE_TOKEN, String)),
    __metadata("design:paramtypes", [String])
], Mental);
```

</p>
</details>

----

Whatever, use the easy way:

```ts
import { provide } from 'difun';
import { HARMONY_TOKEN } from '@tokens';
class Mental {
    constructor(
        private harmony = provide(HARMONY_TOKEN)
    ) {}
}
```

which is compiled into:

```ts
import { provide } from 'difun';
import { HARMONY_TOKEN } from '@tokens';
class Mental {
    constructor(harmony = provide(HARMONY_TOKEN)) {
        this.harmony = harmony;
    }
}
```

Simple, isn't it?

## Installation

Recommend to use [pnpm](https://pnpm.io) for dependency management:

```shell
pnpm add difun
```

## License

difun is [MIT licensed](./LICENSE).
