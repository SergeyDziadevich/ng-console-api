# AGENTS.md — NestJS + MongoDB API + AI Integration

## Architecture Overview

NestJS REST API with MongoDB (Mongoose). All routes are prefixed with `/api` (set globally in `src/main.ts`). The app connects to a local MongoDB instance at `mongodb://localhost/nest_mongodb` (hardcoded in `src/app.module.ts`).

**Active modules** (registered in `AppModule`): `UsersModule`, `PostsModule`, `AuthModule`, `ChatModule`, `AiModule`.  
> ⚠️ `NotificationsModule` exists but is **not imported** in `AppModule` — routes at `notifications/` are currently unreachable.

## Module Structure Pattern

Each feature follows: `<feature>.module.ts` → `<feature>.controller.ts` → `<feature>.service.ts` + `dto/` subfolder.  
Schemas live in the **shared** `src/schemas/` directory, not colocated with modules. Register them per-module via `MongooseModule.forFeature([...])`.

## Key Conventions

**ObjectId validation in controllers** — always validate before calling the service:
```ts
const isValid = mongoose.Types.ObjectId.isValid(id);
if (!isValid) throw new NotFoundException('User does not exist');
```

**Model injection** — use `ModelName.name` (string from the class):
```ts
@InjectModel(User.name) private userModel: Model<User>
```
> Exception: `PostsService` uses raw strings `'Post'` / `'User'` — keep consistent with how the model was registered.

**DTOs** use `class-validator` + `class-transformer`. Nested objects require both `@ValidateNested()` and `@Type(() => NestedDto)`. The global `ValidationPipe` has `whitelist: true` (strips extra fields) and `transform: true` (auto-casts types).

**Mongo duplicate key errors** (code `11000`) are caught in service layer and re-thrown as `ConflictException` (see `UsersService.createUser`).

## Authentication

Custom `AuthGuard` (`src/auth/auth.guard.ts`) — no Passport. Extracts Bearer JWT from `Authorization` header and attaches the decoded payload as `request.user` (typed as `JwtPayload`). `JwtModule` is registered as **global** in `AuthModule`, so `JwtService` is injectable anywhere.

Protect endpoints with `@UseGuards(AuthGuard)`. JWT payload shape is defined in `src/auth/models/auth.interface.ts`.

## Data Relationships

- `User` → `UserSettings` (optional, stored as separate document, linked by `ObjectId`)
- `User` → `Post[]` (array of `ObjectId` refs, updated with `$push` in `PostsService`)
- Creating a user with settings: settings doc is saved first, then its `_id` is stored on the user.
- Use `.populate(['settings', 'posts'])` when fetching users (see `UsersService.getAllUsers`).

## AI Integration

`AiModule` uses **Google Genkit** (`genkit` + `@genkit-ai/google-genai`). The `ai` instance is initialized at module scope (outside the class) in `src/ai/ai.service.ts`. Requires `GOOGLE_GENAI_API_KEY` environment variable at runtime.

## Environment Variables

| Variable | Used in | Notes |
|---|---|---|
| `JWT_SECRET` | `AuthModule` | Falls back to `'secretKey'` if unset |
| `CORS_ORIGIN` | `main.ts` | Controls allowed CORS origins |
| `PORT` | `main.ts` | Defaults to `3000` |
| `GOOGLE_GENAI_API_KEY` | `AiService` | Required for AI endpoints |

## Developer Workflows

```bash
npm run start:dev      # watch mode (primary dev workflow)
npm run start:debug    # debug + watch
npm test               # unit tests (Jest, rootDir: src, *.spec.ts files)
npm run test:e2e       # e2e tests (config: test/jest-e2e.json)
npm run test:cov       # coverage report → /coverage
npm run lint           # ESLint with auto-fix
```

Unit test files are colocated with source files inside `src/`. The Jest config (`package.json`) sets `rootDir: src`.

## Roles

Defined in `src/users/enums/role.enum.ts`: `admin`, `moderator`, `user` (default). Stored as a string enum on the `User` schema.

