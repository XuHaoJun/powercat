# https://hub.docker.com/_/microsoft-dotnet-core
FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build

# install NodeJS 13.x
# see https://github.com/nodesource/distributions/blob/master/README.md#deb
RUN apt-get update -yq 
RUN apt-get install curl gnupg -yq 
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

WORKDIR /source

# copy csproj and restore as distinct layers
COPY *.sln .
COPY RCB.JavaScript/*.csproj ./RCB.JavaScript/
WORKDIR /source/RCB.JavaScript
RUN dotnet restore

# copy everything else and build app
WORKDIR /source
COPY RCB.JavaScript/. ./RCB.JavaScript/
WORKDIR /source/RCB.JavaScript
RUN npm install
RUN dotnet publish -c release -o /app --no-restore RCB.JavaScript.csproj

# final stage/image
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1

RUN apt-get update -yq 
RUN apt-get install curl gnupg -yq 
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app
COPY --from=build /app ./
# ENTRYPOINT ["dotnet", "WebAPI.dll"]
CMD ASPNETCORE_URLS=http://*:$PORT dotnet RCB.JavaScript.dll