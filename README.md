# Messenger API

A real-time chat REST API built with Node.js, Express, MongoDB, and Socket.io.

## Stack

- **Runtime** — Node.js + Express
- **Database** — MongoDB (Mongoose)
- **Real-time** — Socket.io
- **Auth** — JWT + cookies
- **Media** — Cloudinary

## Environment Variables

```env
CLIENT_URL=
MONGO_URL=
JWT_SECRET=
JWT_EXPIRES_IN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=5000
NODE_ENV=production
```

## API Routes

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |

### Users — `/api/user`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-users` | Get all users |
| PUT | `/update-avatar` | Update profile avatar |

### Friends — `/api/friends`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-friend-request/:id` | Send a friend request |
| PATCH | `/accept-friend-request/:id` | Accept a friend request |
| PATCH | `/reject-friend-request/:id` | Reject a friend request |
| GET | `/get-friend-requests` | Get incoming friend requests |
| GET | `/get-friends` | Get friends list |
| DELETE | `/remove-friend/:id` | Remove a friend |

### Conversations — `/api/conversation`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-conversations` | Get user's conversations |
| GET | `/get-conversations-id/:id` | Get conversation by ID |
| POST | `/create-conversations` | Create a conversation |
| POST | `/create-group-conversations` | Create a group conversation |
| PUT | `/update-conversation/:id` | Update group name/avatar |
| DELETE | `/leave-conversation/:id` | Leave a conversation |
| POST | `/add-participant/:id` | Add participant to group |

### Messages — `/api/message`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/get-messages/:id` | Get messages in a conversation |
| POST | `/send-message/:id` | Send a message |
| DELETE | `/delete-message/:id` | Delete a message |
| PATCH | `/edit-message/:id` | Edit a message |
| PATCH | `/mark-as-read` | Mark messages as read |

## Health Check

```
GET /health
```

Returns server uptime and MongoDB connection status.
