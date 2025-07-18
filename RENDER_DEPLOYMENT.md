# HRIS Backend Deployment Guide for Render

This guide will help you deploy your HRIS backend application to Render.

## Prerequisites

1. A GitHub account with your HRIS backend repository
2. A Render account (free tier available)
3. Your application code pushed to GitHub

## Deployment Options

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub** with the `render.yaml` file included
2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy**:
   - Render will create both the PostgreSQL database and web service
   - The database will be automatically connected to your web service
   - All environment variables will be configured automatically

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `hris-postgresql`
   - **Database**: `hris`
   - **User**: `hris_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click "Create Database"
5. Note down the connection details

#### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `hris-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for production)

#### Step 3: Configure Environment Variables

Add these environment variables in your web service settings:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<generate-a-secure-secret>
JWT_REFRESH_SECRET=<generate-a-secure-secret>
JWT_EXPIRES_IN=2h
JWT_REFRESH_EXPIRES_IN=7d
SESSION_TIMEOUT_SECONDS=1800
FRONTEND_URL=https://your-frontend-app.onrender.com
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SPECIAL_CHARS=true
ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RESET=true
ENABLE_EMAIL_VERIFICATION=false
LOG_LEVEL=info
HEALTH_CHECK_ENABLED=true
DEBUG=false
DATABASE_LOGGING=false
```

#### Step 4: Set Up Database

1. **Run Prisma migrations**:
   - Go to your web service dashboard
   - Click "Shell" tab
   - Run: `npx prisma migrate deploy`
   - Run: `npx prisma generate`

2. **Seed the database** (optional):
   - In the shell: `npm run db:seed`

## Environment Variables Explained

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string from Render
- `JWT_SECRET`: Secret key for JWT token signing (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens

### Optional Variables

- `FRONTEND_URL`: Your frontend application URL for CORS
- `PORT`: Port number (Render sets this automatically)
- `NODE_ENV`: Set to `production` for production deployment

## Database Setup

### Automatic Setup (with render.yaml)

The `render.yaml` file automatically:
- Creates a PostgreSQL database
- Connects it to your web service
- Runs Prisma migrations during deployment

### Manual Database Setup

If setting up manually:

1. **Get connection string** from your PostgreSQL service
2. **Set DATABASE_URL** environment variable
3. **Run migrations** in the web service shell:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## Health Check

Your application includes a health check endpoint at `/health`. Render will use this to monitor your service.

## File Uploads

The application supports file uploads to the `./uploads` directory. In Render:
- Files are stored in the container's filesystem
- Files are lost when the container restarts
- For production, consider using cloud storage (AWS S3, etc.)

## Monitoring

- **Logs**: View in your web service dashboard
- **Health**: Monitor via `/health` endpoint
- **Database**: Monitor in PostgreSQL service dashboard

## Troubleshooting

### Common Issues

1. **Build fails**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`

2. **Database connection fails**:
   - Verify `DATABASE_URL` is correct
   - Check if database is running
   - Ensure migrations are applied

3. **Application crashes**:
   - Check logs in Render dashboard
   - Verify all environment variables are set
   - Check if port is correctly configured

### Debug Commands

In the Render shell:
```bash
# Check environment variables
env | grep DATABASE_URL

# Check if Prisma client is generated
ls -la node_modules/.prisma

# Test database connection
npx prisma db pull

# View logs
tail -f /tmp/render.log
```

## Production Considerations

1. **Upgrade to paid plan** for:
   - Custom domains
   - SSL certificates
   - Better performance
   - No sleep mode

2. **Use external database** for:
   - Better performance
   - Data persistence
   - Backup options

3. **Set up monitoring**:
   - Enable Render's built-in monitoring
   - Set up alerts for downtime
   - Monitor database performance

4. **Security**:
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting

## Support

- [Render Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

## Next Steps

After deployment:
1. Test all API endpoints
2. Set up your frontend application
3. Configure domain and SSL
4. Set up monitoring and alerts
5. Plan for scaling 