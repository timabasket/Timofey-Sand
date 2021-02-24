FROM ubuntu:20.04
MAINTAINER Vladimir G. Slugin <v@gkaz.ru>

# envs
ENV DEBIAN_FRONTEND noninteractive

# apt actions
RUN apt-get update \
    && apt-get install -y mongodb \
    && mkdir /srv/data

#run mongo
CMD /usr/bin/mongod --bind_ip 0.0.0.0 --dbpath=/srv/data
