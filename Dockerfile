FROM php:7.2-apache-stretch

# install php extensions
RUN apt-get update && \
    apt-get install -y git zlib1g-dev vim libz-dev && \
    docker-php-ext-install zip mysqli pdo pdo_mysql

# enable apache2 mods
RUN a2enmod rewrite

# install php.ini
COPY docker/php/php.ini /usr/local/etc/php

# install apache2 site conf
COPY docker/apache2/site.conf /etc/apache2/sites-available/site.conf
RUN a2ensite site.conf

# install composer
RUN curl -sS https://getcomposer.org/installer \
  | php -- --install-dir=/usr/local/bin --filename=composer

# set timezone
ENV TIMEZONE=Europe/Luxembourg
RUN ln -snf /usr/share/zoneinfo/$TIMEZONE /etc/localtime && \
    echo $TIMEZONE > /etc/timezone

ADD . /var/www/html
WORKDIR /var/www/html
