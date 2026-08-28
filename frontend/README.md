# Frontend

This is a combination of things that can be used as they are, and incredibly contrived examples.

## Main tools used

- [React](https://react.dev/)
- [React-query](https://tanstack.com/query/latest/docs/framework/react/overview),
  to manage synchronization of state between frontend and backend
- [Wouter](https://github.com/molefrog/wouter), a minimal SPA navigation library
- [ESLint](https://eslint.org/docs/latest/use/core-concepts/)
- [Vitest](https://vitest.dev/guide/)
- [Testing library](https://testing-library.com/docs/), specifically for
  [React](https://testing-library.com/docs/react-testing-library/intro/)

## To run

### Install dependencies

```bash
npm install
```

### Dev server

1. Modify [the frontend specific env file](./.env) (Note this is completely
   unrelated to the docker compose .env file)
2. Run

   ```bash
   npm run dev
   ```

3. Access the server at http://localhost:5173/
4. The UI will run with no dependencies on other projects, but it requires the
   backend to do anything other than show errors

### Tests

```bash
npm test
```
