export default () => ({
  database: {
    hostOnlyRead: process.env.DB_HOST_ONLY_READ,
    hostReadWrite: process.env.DB_HOST_READ_WRITE,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
});
