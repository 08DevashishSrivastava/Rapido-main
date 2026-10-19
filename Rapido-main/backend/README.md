# Backend API

## Register a user

Creates a user account and returns an authentication token.

### Endpoint

```http
POST /users/register
Content-Type: application/json
```

The app mounts the user router at `/users`; the registration route is `/register` within that router. Therefore, the effective path is `/users/register` (not `/user/register`).

### Request body

Send a JSON object with the following fields:

| Field | Required | Constraints |
| --- | --- | --- |
| `fullname.firstname` | Yes | At least 3 characters |
| `fullname.lastname` | No | If provided, at least 3 characters |
| `email` | Yes | Must be a valid email address; must be unique |
| `password` | Yes | At least 6 characters |

Example:

```json
{
  "fullname": {
    "firstname": "Alex",
    "lastname": "Morgan"
  },
  "email": "alex.morgan@example.com",
  "password": "strong-password"
}
```

`fullname.lastname` is optional. The password is hashed before it is stored.

### Responses

#### `201 Created`

Registration succeeded. The response contains the authentication token and the created user:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67123456789abcdef0123456",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex.morgan@example.com",
    "__v": 0
  }
}
```

The response does not include the password.

#### `400 Bad Request`

The request failed validation. The response contains an `errors` array describing each invalid field. For example, submitting an invalid email returns:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Implementation status

The registration route is implemented in `routes/user.routes.js` and is exposed at `/users/register`.

## Log in a user

Authenticates an existing user using their email and password. On success, returns an authentication token and the user's profile.

### Endpoint

```http
POST /users/login
Content-Type: application/json
```

The app mounts the user router at `/users`; the login route is `/login` within that router. Therefore, the effective path is `/users/login` (not `/user/login`).

### Request body

Both fields are required:

| Field | Required | Constraints |
| --- | --- | --- |
| `email` | Yes | Must be a valid email address |
| `password` | Yes | At least 6 characters |

Example:

```json
{
  "email": "alex.morgan@example.com",
  "password": "strong-password"
}
```

### Responses

#### `200 OK`

The credentials are valid. The response contains a JWT and the user's profile; the password is not returned:

```json
{
  "token": "<jwt-token>",
  "user": {
    "_id": "67123456789abcdef0123456",
    "fullname": {
      "firstname": "Alex",
      "lastname": "Morgan"
    },
    "email": "alex.morgan@example.com",
    "__v": 0
  }
}
```

#### `400 Bad Request`

The email or password is missing or does not satisfy validation. For example, an invalid email returns:

```json
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

#### `401 Unauthorized`

The email is not registered or the password does not match:

```json
{
  "message": "Invalid email or password"
}
```

The same message is used for either case so the response does not reveal whether an email is registered.

## Get the authenticated user's profile

Returns the profile belonging to the authenticated user.

### Endpoint

```http
GET /users/profile
Authorization: Bearer <jwt-token>
```

The token can also be sent in a `token` cookie. The endpoint requires a valid, unexpired token that has not been blacklisted.

### Request

No request body is required.

### Responses

#### `200 OK`

The authenticated user's profile is returned. The password is excluded:

```json
{
  "_id": "67123456789abcdef0123456",
  "fullname": {
    "firstname": "Alex",
    "lastname": "Morgan"
  },
  "email": "alex.morgan@example.com",
  "__v": 0
}
```

#### `401 Unauthorized`

The token is missing, invalid, expired, or blacklisted:

```json
{
  "message": "Unauthorized"
}
```

## Log out a user

Invalidates the current JWT by adding it to the token blacklist and clears the `token` cookie.

### Endpoint

```http
POST /users/logout
Authorization: Bearer <jwt-token>
```

The token can also be sent in a `token` cookie. The endpoint requires a valid, unexpired token that has not already been blacklisted. No request body is required.

### Responses

#### `200 OK`

Logout succeeded:

```json
{
  "message": "Logged out"
}
```

The blacklist record expires automatically after 24 hours.

#### `401 Unauthorized`

The token is missing, invalid, expired, or already blacklisted:

```json
{
  "message": "Unauthorized"
}
```

## Captain routes

Captain routes are mounted at `/captains`. The examples below use JSONC so comments can describe requirements and constraints; remove comments before sending a request.

### Register a captain

Creates a captain account and returns an authentication token.

#### Endpoint

```http
POST /captains/register
Content-Type: application/json
```

#### Request body

```jsonc
{
  "fullname": {
    "firstname": "Jordan", // Required; at least 3 characters
    "lastname": "Lee" // Optional; if provided, at least 3 characters
  },
  "email": "jordan.lee@example.com", // Required; valid and unique email
  "password": "strong-password", // Required; at least 6 characters
  "vehicle": {
    "color": "blue", // Required; at least 3 characters
    "plate": "ABC123", // Required; at least 3 characters
    "capacity": 4, // Required; integer of at least 1
    "vehicleType": "car" // Required; "car", "motorcycle", or "auto"
  }
}
```

#### Responses

##### `201 Created`

```jsonc
{
  "token": "<jwt-token>", // Expires after 24 hours
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Jordan",
      "lastname": "Lee"
    },
    "email": "jordan.lee@example.com",
    "password": "<bcrypt-hash>", // Current controller may expose this hash
    "status": "inactive",
    "vehicle": {
      "color": "blue",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
}
```

The password hash is sensitive and should not be returned to clients.

##### `400 Bad Request` — validation error

```jsonc
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

##### `400 Bad Request` — captain already exists

```jsonc
{
  "message": "Captain already exist"
}
```

##### Registration implementation issue

The captain model also requires `vehicle.latitude` and `vehicle.longitude`, but the registration controller does not pass these properties to the model. Consequently, creating a captain can fail model validation. The exact error response depends on Express error handling.

### Log in a captain

Authenticates a captain with their email and password.

#### Endpoint

```http
POST /captains/login
Content-Type: application/json
```

#### Request body

```jsonc
{
  "email": "jordan.lee@example.com", // Required; valid email
  "password": "strong-password" // Required; at least 6 characters
}
```

#### Responses

##### `200 OK`

```jsonc
{
  "token": "<jwt-token>", // Expires after 24 hours
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Jordan",
      "lastname": "Lee"
    },
    "email": "jordan.lee@example.com",
    "password": "<bcrypt-hash>", // Current controller selects and may expose the hash
    "status": "inactive",
    "vehicle": {
      "color": "blue",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
}
```

The controller also sets the JWT in a `token` cookie.

##### `400 Bad Request` — validation error

```jsonc
{
  "errors": [
    {
      "type": "field",
      "value": "not-an-email",
      "msg": "Invalid Email",
      "path": "email",
      "location": "body"
    }
  ]
}
```

##### `401 Unauthorized` — invalid credentials

The same response is returned when the email is not found or the password does not match:

```jsonc
{
  "message": "Invalid email or password"
}
```

### Get the captain profile

Returns the authenticated captain's profile.

#### Endpoint

```http
GET /captains/profile
Authorization: Bearer <jwt-token>
```

No request body is required. The JWT may also be sent in the `token` cookie.

#### Responses

##### `200 OK`

```jsonc
{
  "captain": {
    "_id": "<captain-id>",
    "fullname": {
      "firstname": "Jordan",
      "lastname": "Lee"
    },
    "email": "jordan.lee@example.com",
    "status": "inactive",
    "vehicle": {
      "color": "blue",
      "plate": "ABC123",
      "capacity": 4,
      "vehicleType": "car"
    }
  }
}
```

##### `401 Unauthorized`

```jsonc
{
  "message": "Unauthorized" // Missing, invalid, expired, or blacklisted token
}
```

### Log out a captain

The current router declares logout as `GET /captains/logout`. It requires authentication and is intended to blacklist the current token and clear the `token` cookie.

#### Endpoint

```http
GET /captains/logout
Authorization: Bearer <jwt-token>
```

No request body is required. The JWT may also be sent in the `token` cookie.

#### Intended response

##### `200 OK`

```jsonc
{
  "message": "Logout successfully"
}
```

##### `401 Unauthorized`

```jsonc
{
  "message": "Unauthorized" // Missing, invalid, expired, or blacklisted token
}
```

#### Captain route implementation issues

- `captain.routes.js` references `authMidddleware` for the logout route; the imported variable is `authMiddleware`. This typo prevents the captain router from loading.
- `authCaptain` does not call `next()` after successfully authenticating, so authenticated profile and logout requests do not reach their controllers.
- The captain logout controller uses `blackListTokenModel` without importing it.

Until these issues are fixed, the profile and logout examples describe the intended responses, not working endpoint behavior.
