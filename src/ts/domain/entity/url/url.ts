import Directory from '@/domain/entity/url/directory';
import Hash from '@/domain/entity/url/hash';
import Host from '@/domain/entity/url/host';
import Hostname from '@/domain/entity/url/hostname';
import Href from '@/domain/entity/url/href';
import Origin from '@/domain/entity/url/origin';
import Password from '@/domain/entity/url/password';
import Pathname from '@/domain/entity/url/pathname';
import Port from '@/domain/entity/url/port';
import Protocol from '@/domain/entity/url/protocol';
import Search from '@/domain/entity/url/search';
import Username from '@/domain/entity/url/username';
import ValueObject from '@/domain/entity/valueObject';

interface UrlProps {
  readonly hash: Hash;
  readonly host: Host;
  readonly hostname: Hostname;
  readonly href: Href;
  readonly origin: Origin;
  readonly password: Password;
  readonly pathname: Pathname;
  readonly port: Port;
  readonly protocol: Protocol;
  readonly search: Search;
  readonly username: Username;
  readonly directory: Directory;
}

export default class Url extends ValueObject<UrlProps> {
  static of(props: UrlProps): Url {
    return new Url(props);
  }

  static href(href: string): Url {
    const url = new URL(href);

    const dirs = url.pathname
      .split('/')
      .filter((value) => value && value !== '');

    const auth =
      url.username && url.password ? `${url.username}]${url.password}@` : '';

    const directory =
      dirs.length >= 2
        ? `${url.protocol}//${auth}${url.host}/${dirs
            .splice(0, dirs.length - 1)
            .join('/')}`
        : '';

    return Url.of({
      hash: Hash.of(url.hash),
      host: Host.of(url.host),
      hostname: Hostname.of(url.hostname),
      href: Href.of(url.href),
      origin: Origin.of(url.origin),
      password: Password.of(url.password),
      pathname: Pathname.of(url.pathname),
      port: Port.of(url.port),
      protocol: Protocol.of(url.protocol),
      search: Search.of(url.search),
      username: Username.of(url.username),
      directory: Directory.of(directory),
    });
  }

  get hash(): Hash {
    return this.value.hash;
  }

  get host(): Host {
    return this.value.host;
  }

  get hostname(): Hostname {
    return this.value.hostname;
  }

  get href(): Href {
    return this.value.href;
  }

  get origin(): Origin {
    return this.value.origin;
  }

  get password(): Password {
    return this.value.password;
  }

  get pathname(): Pathname {
    return this.value.pathname;
  }

  get port(): Port {
    return this.value.port;
  }

  get protocol(): Protocol {
    return this.value.protocol;
  }

  get search(): Search {
    return this.value.search;
  }

  get username(): Username {
    return this.value.username;
  }

  get directory(): Directory {
    return this.value.directory;
  }

  override toJSON(): any {
    return this.href.value;
  }
}
