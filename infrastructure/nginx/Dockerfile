FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

# Create log directories and forward logs to stdout/stderr
RUN mkdir -p /var/log/nginx && \
    ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
