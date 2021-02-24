FROM ubuntu:20.04
MAINTAINER Vladimir G. Slugin <v@gkaz.ru>

# envs
ENV DEBIAN_FRONTEND noninteractive

# apt actions
RUN apt-get update \
    && apt-get install -y cron

COPY cron.tasks /tmp
RUN crontab /tmp/cron.tasks

CMD ["cron", "-f"]