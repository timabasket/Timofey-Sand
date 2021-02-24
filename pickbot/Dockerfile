FROM ubuntu:20.04
MAINTAINER V.Slugin <v@gkaz.ru>

WORKDIR /srv

# envs
ENV DEBIAN_FRONTEND noninteractive
ENV PATH "$PATH:/opt/nodejs/bin"

# install lts node platform
COPY nodejs.xz /opt
COPY shotcut.xz /opt
RUN apt-get update \
&& apt-get install -y curl git zip xz-utils libasound2-dev libjack-dev \
libcairo2 libharfbuzz-dev python make cmake g++ \
imagemagick inkscape \
&& cd /opt \
&& tar xf nodejs.xz \
&& ln -s node-v14.15.2-linux-x64 nodejs \
&& tar xf shotcut.xz \
&& rm shotcut.xz nodejs.xz
 
# uncomment for production (and comment two lines in docker-compose file)
#COPY src /srv/pickbot

COPY startup.sh /srv

# prod - uncommented, dev - commented
COPY startup1.sh /srv

# dev - uncommented, prod - commented
CMD /srv/startup1.sh

# prod - uncommented, dev - commented
#CMD /srv/startup.sh