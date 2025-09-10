# Debugging 401 Error on /api/users Checklist

## Backend Investigation
- [ ] Examine the backend route definition for `/api/users`.
- [ ] Check the authentication middleware applied to the `/api/users` route.
- [ ] Verify the authorization logic for the "admin" role.
- [ ] Inspect the token parsing and validation logic in the authentication middleware.
- [ ] Check server logs for more detailed error messages when the 401 occurs.

## Frontend Investigation
- [ ] Examine the `UsersManager.js` component to see how it calls `/api/users`.
- [ ] Check how the authentication token is retrieved from storage (e.g., localStorage, Zustand store).
- [ ] Verify how the token is being attached to the request headers (e.g., `Authorization: Bearer <token>`).
- [ ] Inspect the `LoginForm.js` to see how the token is stored upon successful login.
- [ ] Check the Zustand store (`useStore.js`) for state management related to the auth token and user role.
- [ ] Look for any logic that might clear the token or redirect to login on a 401 response (potentially in an axios interceptor).
