---
title: Secure Authentication in Laravel 11 with lcobucci/jwt
description: A step-by-step guide for implementing secure authentication using lcobucci/jwt in Laravel 11, including key generation, database setup, and testing.
date: 2024-10-14 19:30
categories: [Laravel, JWT]
tags: [php, lcobucci, jwt, laravel, authentication]
author: shahmal1yev
---

> This guide is intended to provide a general overview, and the code samples included are designed as templates. It 
> is not recommended to use them directly in a real project without adjustments.
{: .prompt-warning }

## Getting Started

This guide will walk you through implementing a secure JWT-based authentication system in a Laravel 11 application.

JWT (JSON Web Tokens) offers a reliable way to manage authentication and authorization through tokens that can be 
easily passed between client  and server. We'll cover the full implementation process, including generating RSA keys,
managing tokens, setting up necessary configurations, and ensuring security with middleware. By the end of this 
guide, you'll have a robust and secure authentication system integrated into your Laravel application.

## Setup and Dependencies

To get started, we need to install the necessary packages that will help us implement JWT-based authentication and 
token management.

### **<a href="https://github.com/lcobucci/jwt" target="_blank">lcobucci/jwt</a>**

The `lcobucci/jwt` library is a powerful and widely-used PHP library for creating, parsing, and validating JWTs. This 
package makes it easy to handle both symmetric and asymmetric encryption for signing and verifying JWTs. In this 
guide, we'll use RSA encryption (asymmetric) for added security, ensuring that tokens are securely signed and verified.

To install `lcobucci/jwt`, run:

```shell
composer require lcobucci/jwt
```

**Key features of `lcobucci/jwt`**:
- **Token Creation**: Easily generate JWT tokens with headers, calims, and signature.
- **Token Validation**: Supports multiple validation methods, including signature, expiration, and custom claims 
  validation.
- **Asymmetric Encryption**: Sign and verify tokens using public and private RSA keys, providing enhanced security.

  This library will be the backbone of our JWT-based authentication system, enabling secure token management.

### **<a href="https://github.com/kongulov/interact-with-enum" target="_blank">kongulov/interact-with-enum</a>**

Enums in PHP (introduced in PHP 8.1) are a great way to define a set of possible values for a variable. The 
`kongulov/interact-with-enum` package provides convenient utilities for interacting with enums in Laravel 
applications. We'll use this package to manage token types, such as distinguishing between **access** and 
**refresh** tokens.

Install `kongulov/interact-with-enum` by running:

```shell
composer require kongulov/interact-with-enum
```

Benefits of `kongulov/interact-with-enum`:
- **Flexible Enum Handling**: Provides an easy way to convert enums to strings and vice versa, making it simpler 
to handle enum values in database queries or validations.
- **Trait-based Utility**: It introduces a trait (`InteractWithEnum`) that allows enums to be more dynamic and 
manageable within your application.

By using this package, we'll streamline the handling of JWT token types, ensuring that our token-based 
authentication system is both maintainable and extensible.

## Generating Keys for Asymmetric Encryption

In JWT-based authentication, asymmetric encryption (RSA) is commonly used to sign and verify tokens. This approach 
involves the creation of two keys:

- **Private key**: Used to sign the token.
- **Public key**: Used to verify token.

The following steps outline how to generate these RSA keys and configure them for use in your Laravel application.

### Step 1: Create a Directory for JWT Keys

First, ensure that a secure directory for storing the JWT keys exists in your `storage` folder.
These keys will be securely stored in the `storage/jwt` directory.

```shell
mkdir -p storage/jwt
```

### Step 2: Generate the Private Key

The private key is used to sign JWT tokens, ensuring they are securely issued by the server. To generate a 2048-bit 
RSA private key, use the following command:

```shell
openssl genpkey -algorithm RSA -out storage/jwt/private_key.pem -pkeyout rsa_keygen_bits:2048
```

This command generates a private key and stores it in the `storage/jwt/private_key.pem` file.

### Step 3: Generate the Public Key

Once the private key is generated, you need to generate the corresponding public key. The public key will be used to 
verify the JWT's signature.

Use the following command to generate the public key:

```shell
openssl rsa -pubout -in storage/jwt/private_key.pem -out storage/jwt/public_key.pem
```

This command reads the private key and generates a public key, storing it in the `storage/jwt/public_key.pem` file.

### Step 4: Set Permissions for the Private Key

For security reasons, it is important to set appropriate file permissions for the private key to prevent 
unauthorized access. Run the following command to set the permissions for the private key:

```shell
chmod 0644 storage/jwt/private_key.pem
```

This ensures that only the owner can modify the private key, while others can read it if needed.

### Step 5: Update the .env File with Key Paths

Next, you need to update your `.env` file with the pats to the private and public keys. These keys will be 
referenced in your application to sign and verify JWTs.

Add the following lines to your .env file:

```dotenv
JWT_PRIVATE_KEY=/full/path/to/storage/jwt/private_key.pem
JWT_PUBLIC_KEY=/full/path/to/storage/jwt/public_key.pem
```

### Step 6: Create a JWT Configuration File

In addition to updating the `.env` file, it's important to create a configuration file to manage JWT-related 
settings. This file will store paths to the keys and other JWT-specific settings such as token lifespan.

Create a `jwt.php` file in the `config` directory with the following content:

```php
<?php

return [
    'public_key_path' => realpath(env("JWT_PUBLIC_KEY", storage_path("jwt/public_key.pem"))),
    'private_key_path' => realpath(env("JWT_PRIVATE_KEY", storage_path("jwt/private_key.pem"))),
    'access' => [
        'ttl' => 30, // Time to live for access tokens (in minutes)
        'cbu' => 0,  // Can be used after (in minutes)
    ],
    'refresh' => [
        'ttl' => 21600, // Time to live for refresh tokens (in minutes - 15 days)
        'cbu' => 0,       // Can be used after (in minutes)
    ]
];

```

This configuration file allows you to define:

- The paths to the private and public keys.
- Token lifespan (TTL) for **access** and **refresh** tokens, measured in minutes.
- How long after issuance the token can be used (CBU: "can be used after").

### Step 7: Protect JWT Keys from Version Control

To ensure that your JWT keys are not accidentally committed to version control, you should add a `.gitignore` file 
to the `storage/jwt` directory. This ensures that the keys are not tracked by Git, which helps maintain security 
across different environments.

Create a `.gitignore` file in the `storage/jwt` folder with the following content:

```text
*
!.gitignore
```

This rule will ignore all files in the `jwt` directory except for the `.gitignore` file itself. This ensures that 
your keys are safe from version control, while still allowing the directory structure to be maintained.

### Conclusion

By generating RSA keys and configuring your Laravel application to use them, you set the foundation for secure 
JWT-based authentication. These keys ensure that tokens are securely signed and verified using asymmetric encryption,
enhancing the overall security of your application.

## Database Setup

First, we need two separate tables (migrations):

- **jwt_tokens**: We will store our JWT tokens and their related details in this table.
- **jwt_token_blacklist**: We will keep records for blacklisted tokens in this table.

### Creating Migrations

Create these migrations using `artisan`:

```shell
php artisan make:migration create_jwt_tokens_table
php artisan make:migration create_jwt_token_blacklist_table
```

### jwt_tokens table

Let's fill out our first migration file as follows:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('jwt_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->morphs('tokenable');
            $table->json('token');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jwt_tokens');
    }
};

```

In this migration, we have four columns:


In this migration, we have four columns:

- **uuid**('id'): We define a unique key for each JWT. Using UUID allows us to directly use it for the jti (JWT ID) claim
  found in the JWT's payload without handling an additional value.
- **morphs**('tokenable'): More information about polymorphic relationships can be found 
  <a href="https://laravel.com/docs/11.x/eloquent-relationships#polymorphic-relationships" target="_blank">here</a>. We 
  use a polymorphic relationship to easily extend this implementation for other models in the future if needed.
- **json**('token'): We will store the unencrypted form of our tokens here.
- **timestamps()**: We add the general and necessary timestamp columns for our table.

### jwt_token_blacklist table

Let's fill out our second migration file:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('jwt_token_blacklist', function (Blueprint $table) {
            $table->id();
            $table->uuid('jwt_token_id');
            $table->timestamps();

            $table->foreign('jwt_token_id')->references('id')->on('jwt_tokens');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jwt_token_blacklist');
    }
};

```

In this table, we have three columns:
- **id()**: We define our primary key of big integer type.
- **uuid('jwt_token_id')**: We create and relate a column of the same type as the primary key present in the 
  first table.
- **timestamps()**: As in other tables, we add our general time-related columns here.

### Adding TokenTypeEnum

We will also define the `TokenType` enum to distinguish between **access** and **refresh** tokens. The `TokenType` 
enum is as follows:

```php
<?php

namespace App\Enums\JWT;

use Kongulov\Traits\InteractWithEnum;

enum TokenType: string
{
    use InteractWithEnum;

    case ACCESS = 'access';
    case REFRESH = 'refresh';
}

```

This enum defines two types of tokens:
- ACCESS: Represents access tokens.
- REFRESH: Represents refresh tokens.

The `InteractWithEnum` trait, provided by the 
<a href="https://packagist.org/packages/kongulov/interact-with-enum" target="_blank">`kongulov/interact-with-enum`</a> 
Laravel package, allows for easy 
interaction with enum values throughout the application. This package simplifies working with enums, making it 
easier to convert them to strings or use them in various parts of your application.

### Running Migrations

After creating the migrations, run the following command to apply them to the database:

```php
php artisan migrate
```

### Creating Models

Now that our migrations are ready, we can write the models that refer to them.

**Token Model**

First, let's create the `Token` model that refers to the `jwt_tokens` table:

```php
<?php

namespace App\Models\JWT;

use App\Casts\TokenCast;
use App\Contracts\JWT\TokenServiceInterface;
use App\Enums\JWT\TokenType;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;

class Token extends Model
{
    use HasFactory;

    protected $table = 'jwt_tokens';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'token',
        'tokenable_id',
        'tokenable_type'
    ];

    protected $hidden = [
        'tokenable_id',
        'tokenable_type'
    ];

    protected function casts(): array
    {
        return [
            'token' => TokenCast::class,
        ];
    }

    public function isAccessToken(): bool
    {
        return $this->tokenIs(TokenType::ACCESS);
    }

    public function isRefreshToken(): bool
    {
        return $this->tokenIs(TokenType::REFRESH);
    }

    public function tokenIs(TokenType $type): bool
    {
        return $this->token->claims()->get('typ') === $type->value;
    }

    public function isRevoked(): HasOne
    {
        return $this->hasOne(TokenBlacklist::class, 'jwt_token_id', 'id');
    }

    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    protected function encrypt(): Attribute
    {
        return Attribute::make(
            get: fn (mixed $value, array $attributes) => app()->get(TokenServiceInterface::class)->encrypt(
                $attributes['id'],
                $attributes['tokenable_id'],
                Carbon::parse($attributes['created_at']),
                Carbon::parse($attributes['expires_at']),
                Carbon::parse($attributes['can_be_used_after'])
            )
        );
    }
}

```

> According to the current implementation, each `Token` model simultaneously refers to an 
> <a href="https://github.com/lcobucci/jwt/blob/5.5.x/src/UnencryptedToken.php">`UnencryptedToken`</a>.
  {: .prompt-tip }

**Explanation of Model Properties:**

- **$table**: Specifies the table the model will reference, which is `jwt_tokens` in our case.
- **$keyType**: [`Eloquent`](https://laravel.com/docs/11.x/eloquent) assumes the `primary key` is an `integer` by default. 
  We specify it's a `string`.
- **$incrementing**: Since our primary key isn't an auto-incrementing `integer`, we set this to `false`.
- **$fillable**: Specifies the attributes that are mass assignable.
- **$hidden**: Attributes that should be hidden for arrays and JSON serialization.
- **$casts**: Specifies the attributes that should be cast to native types or custom casts.

**Explanation of Model Methods:**
- **isAccessToken()**: Checks if the token is an `access` token. 
- **isRefreshToken()**: Checks if the token is a `refresh` token.
- **tokenIs(TokenType $type)**: Checks if the token is of a specified type.
- **isRevoked()**: Defines a `relationship` with the `TokenBlacklist` model to check if the token is revoked.

**TokenBlacklist Model**

Create the `TokenBlacklist` model that refers to the `jwt_token_blacklist` table:

```php
<?php

namespace App\Models\JWT;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TokenBlacklist extends Model
{
    use HasFactory;

    protected $table = 'jwt_token_blacklist';

    protected $fillable = [
        'jwt_token_id'
    ];
}
```

### Custom Mutator Class: TokenCast

In our `Token` model, we defined a custom cast for the `token` attribute. Now, let's create the `TokenCast` class:

```php
<?php

namespace App\Casts;

use App\Contracts\JWT\TokenServiceInterface;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use JsonException;
use Lcobucci\JWT\Token\RegisteredClaims;
use Lcobucci\JWT\UnencryptedToken;

class TokenCast implements CastsAttributes
{
    protected TokenServiceInterface $service;

    public function __construct()
    {
        $this->service = app()->get(TokenServiceInterface::class);
    }

    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     * @throws JsonException
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        $decoded = json_decode(
            json: $value,
            associative: true,
            flags: JSON_THROW_ON_ERROR
        );

        $claims = collect($decoded['claims'])->map(function($value, $claim) {
            if (in_array($claim, RegisteredClaims::DATE_CLAIMS)) {
                return Carbon::parse($value['date'], $value['timezone'])->toDateTimeImmutable();
            }

            return $value;
        });

        $token = $this->service->build($claims);

        return $token;
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     * @throws JsonException
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        /** @var  UnencryptedToken $value */

        $components = [
            'headers' => $value->headers()->all(),
            'claims' => $value->claims()->all(),
        ];

        $encoded = json_encode(
            $components,
            JSON_THROW_ON_ERROR
        );

        return $encoded;
    }
}

```

**Explanation:**

With this custom cast, we handle the `token` attribute's transformation when retrieving from or storing to the database:

- set method: Takes an `UnencryptedToken` instance and stores it in JSON format. 
- get method: Converts the JSON data retrieved from the database back into an `UnencryptedToken` instance.

### Conclusion

At this point, we have completed our database setup and models. We can now proceed to create service classes and 
other necessary components for generating and verifying JWTs.

## Creating the TokenService

The `TokenService` is responsible for generating, signing, verifying, and revoking JWT tokens in your Laravel 
application. This service will interact with `Token` model and use asymmetric encryption (RSA) to secure the tokens.

In this section, we will walk through the `TokenService` class and its role in managing JWT-based authentication.

### TokenServiceInterface

The `TokenServiceInterface` defines the contract for the token service. This ensures that any implementation of the 
service will have the following core methods:

```php
<?php

namespace App\Contracts\JWT;

use App\Models\JWT\Token;
use Illuminate\Support\Collection;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\UnencryptedToken;

interface TokenServiceInterface
{
    /**
     * Revoke one or more tokens.
     *
     * @param  Token|Collection  $token
     * @return void
     */
    public function revoke(Token|Collection $token): void;

    /**
     * Get the JWT configuration, including signer and key paths.
     *
     * @return Configuration
     */
    public function config(): Configuration;

    /**
     * Generate JWT claims based on the subject.
     *
     * @param  string  $sub
     * @return Collection
     */
    public function data(string $sub): Collection;

    /**
     * Build and return the signed JWT.
     *
     * @param  Collection  $claims
     * @return UnencryptedToken
     */
    public function build(Collection $claims): UnencryptedToken;
}

```

This interface ensures that any token service implementation provides the ability to revoke tokens, configure 
signing and encryption, generate token claims, and create new tokens.

### TokenService Implementation

The `TokenService` class implements the `TokenServiceInterface` and provides concrete logic for handling JWT tokens. 
Below are the key methods of the service:

```php
<?php

namespace App\Services;

use App\Contracts\JWT\TokenServiceInterface;
use App\Enums\JWT\TokenType;
use App\Models\JWT\Token;
use App\Models\JWT\TokenBlacklist;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha512;
use Lcobucci\JWT\Token\RegisteredClaims;
use Lcobucci\JWT\UnencryptedToken;

class TokenService implements TokenServiceInterface
{
    /**
     * Get JWT configuration.
     */
    public function config(): Configuration
    {
        $privateKey = config('jwt.private_key_path');
        $publicKey = config('jwt.public_key_path');

        return Configuration::forAsymmetricSigner(
            new Sha512(),
            InMemory::file($privateKey),
            InMemory::file($publicKey),
        );
    }

    /**
     * Build and sign a new JWT token.
     *
     * @throws Exception
     */
    public function build(Collection $claims): UnencryptedToken
    {
        $config = $this->config();

        $builder = $config->builder();

        // Map claims to their corresponding builder methods
        $methods = [
            RegisteredClaims::ID => 'identifiedBy',
            RegisteredClaims::SUBJECT => 'relatedTo',
            RegisteredClaims::ISSUER => 'issuedBy',
            RegisteredClaims::ISSUED_AT => 'issuedAt',
            RegisteredClaims::EXPIRATION_TIME => 'expiresAt',
            RegisteredClaims::NOT_BEFORE => 'canOnlyBeUsedAfter',
        ];

        $claims->each(function($value, string $name) use (&$builder, $methods) {
            $builder = array_key_exists($name, $methods)
                ? $builder->{$methods[$name]}($value)
                : $builder->withClaim($name, $value);
        });

        return $builder->getToken(
            $config->signer(),
            $config->signingKey()
        );
    }

    /**
     * Generate claims for access and refresh tokens.
     */
    public function data(string $sub): Collection
    {
        $time = now();
        $iss = config('app.url');
        $grp = Str::uuid()->toString();

        // Generate claims for both access and refresh tokens
        $payloads = collect(TokenType::cases())->map(function (TokenType $type) use ($sub, $time, $iss, $grp) {
            $jti = Str::uuid()->toString();

            return collect([
                RegisteredClaims::ID => $jti,
                'grp' => $grp,
                'typ' => $type->value,
                RegisteredClaims::SUBJECT => $sub,
                RegisteredClaims::ISSUER => $iss,
                RegisteredClaims::ISSUED_AT => $time->toDateTimeImmutable(),
                RegisteredClaims::EXPIRATION_TIME => $time->copy()->addMinutes(config("jwt.{$type->value}.ttl"))->toDateTimeImmutable(),
                RegisteredClaims::NOT_BEFORE => $time->copy()->addMinutes(config("jwt.{$type->value}.cbu"))->toDateTimeImmutable(),
            ]);
        });

        return $payloads;
    }

    /**
     * Revoke a token or a collection of tokens.
     *
     * @param  Token|Collection  $token
     * @return void
     */
    public function revoke(Token|Collection $token): void
    {
        $collection = ($token instanceof Token) ? collect([$token]) : $token;

        // Insert tokens into the blacklist
        $collection = $collection->map(fn (Token $token) => ['jwt_token_id' => $token->id]);

        TokenBlacklist::insert($collection->toArray());
    }
}

```

**Key Methods and Responsibilities**

- **config()**: Retrieves the JWT configuration, including the signer and paths to the private and public keys. 
  These keys are used for signing and verifying tokens.
- **build()**: This method generates and signs a JWT token based on the provided claims. The claims include standard 
  claims like the subject, issuer, and expiration time, along with any custom claims.
- **data()**: Creates claims for both `access` and `refresh` tokens, using `TokenType` to differentiate between the 
  two. The expiration time (TTL) and the time before the token can be used (CBU) are also configured here.
- **revoke()**: Revokes one or more tokens by adding them to the `TokenBlacklist`. This prevents future use of any 
  token added to the blacklist.

### TokenServiceProvider

The `TokenServiceProvider` registers the `TokenService` in the service container. It also defines a custom JWT-based 
guard using Laravel's authentication system.

```php
<?php

namespace App\Providers;

use App\Contracts\JWT\TokenServiceInterface;
use App\Services\Auth\Guard\TokenGuard;
use App\Services\TokenService;
use Illuminate\Auth\RequestGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class TokenServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind the TokenServiceInterface to the TokenService implementation
        $this->app->bind(TokenServiceInterface::class, TokenService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Extend Laravel's Auth system with the custom JWT-based guard
        Auth::extend('jwt', function ($app, $name, array $config) {
            return new RequestGuard(
                new TokenGuard(app()->get(TokenServiceInterface::class)),
                request(),
                Auth::createUserProvider($config['provider'])
            );
        });
    }
}

```

This provider ensures that the `TokenService` is available for dependency injection throughout the application, and 
it sets up the custom JWT guard for authentication.

### Declaring the Provider in the Application

Once the `TokenServiceProvider` is defined, you need to declare it within the application so Laravel recognizes and 
loads it. To do this, add the provider to the `bootstrap/providers.php` file, which contains the list of service 
providers that will be registered when the application starts.

Open the `boostrap/providers.php` file and add the following entry:

```php
<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\TokenServiceProvider::class,  // Add this line
    App\Providers\TelescopeServiceProvider::class,
    L5Swagger\L5SwaggerServiceProvider::class
];

```

### Configuring the Authentication Guard in `config/auth.php`

You also need to update the `config/auth.php` file to define the JWT-based guard. This guard will handle 
authentication using the tokens generated and verified by the `TokenService`.

Update the `guards` section in `config/auth.php` as follows:

```php
<?php

return [

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        'api' => [
            'driver' => 'jwt',  // Use the custom JWT driver
            'provider' => 'users', // Use the 'users' provider
        ]
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', App\Models\User::class),
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];

```

In the `guards` section, the `api` guard is now configured to use the `jwt` driver, which is provided by the `TokenService` 
we defined earlier.

### Conclusion

The **Token Service** plays a crucial role in managing JWT-based authentication, providing functionality to generate,
sign, verify, and revoke tokens. With the use of asymmetric encryption (RSA), the service ensures secure token 
issuance and validation. Additionally, the custom JWT guard allows seamless integration with Laravel's 
authentication system.

## Configure API Gate and Related Files

In this section, we will configure the **API Gate** for managing JWT-based authentication in Laravel. The API gate 
is responsible for intercepting incoming API requests, validating JWT tokens, and authenticating users based on the 
token's claims.

### Creating The TokenGuard Class

The `TokenGuard` class is the key component that validates incoming requests and ensures that they contain a valid 
JWT. This guard will handle extracting the JWT from the request, validating the token, and identifying the user from 
the token's claims.

Here is the `TokenGuard` class:

```php
<?php

namespace App\Services\Auth\Guard;

use App\Traits\TokenValidation;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;
use Throwable;

class TokenGuard
{
    use GuardHelpers;
    use TokenValidation;

    /**
     * Handle the incoming request and authenticate the user based on JWT token.
     *
     * @param  Request  $request
     * @param  UserProvider  $provider
     * @return Authenticatable|null
     *
     * @throws AuthenticationException
     * @throws AuthorizationException
     * @throws Throwable
     */
    public function __invoke(Request $request, UserProvider $provider): ?Authenticatable
    {
        // Retrieve and validate the JWT from the request
        throw_if(! $token = $this->getTokenForRequest($request), AuthenticationException::class);

        // Retrieve the user based on the token's "sub" (subject) claim
        throw_if(! $tokenable = $provider->retrieveById($token->claims()->get('sub')), AuthenticationException::class);

        // Set the authenticated user
        return $this->user = $tokenable;
    }
}

```

### TokenValidation Trait

The `TokenValidation` trait is essential for extracting and validating JWT tokens from incoming requests. It handles 
retrieving tokens from various parts of the request (headers, query parameters, etc.) and verifying the token's 
signature, expiration, and other claims.

Here is the `TokenValidation` trait:

```php
<?php

namespace App\Traits;

use App\Models\JWT\Token;
use App\Contracts\JWT\TokenServiceInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Exception;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha512;
use Lcobucci\JWT\UnencryptedToken;
use Throwable;

trait TokenValidation
{
    protected TokenServiceInterface $service;
    protected Configuration $config;
    protected string $inputKey;

    public function __construct(
        ?TokenServiceInterface $service = null,
        string $inputKey = 'token',
    ) {
        $this->service = $service ?? app()->get(TokenServiceInterface::class);
        $this->config = $this->service->config();
        $this->inputKey = $inputKey;
    }

    /**
     * Get the token for the current request.
     *
     * @param  Request  $request
     * @return UnencryptedToken|null
     */
    private function getTokenForRequest(Request $request): ?UnencryptedToken
    {
        $token = $request->query($this->inputKey);

        if (empty($token)) {
            $token = $request->input($this->inputKey);
        }

        if (empty($token)) {
            $token = $request->cookie($this->inputKey);
        }

        if (empty($token)) {
            $token = $request->bearerToken() ?: null;
        }

        if ($token) {
            try {
                $token = $this->config->parser()->parse($token);
            } catch (Exception) {
                $token = null;
            }
        }

        return $token;
    }

    /**
     * Verify the validity of a JWT token.
     *
     * @throws AuthorizationException
     */
    private function validate(UnencryptedToken $token, Token $record): void
    {
        // Token validation logic here, including checking signature, expiration, and revocation
    }
}

```

**Explanation**:

- **getTokenForRequest()**: Retrieves the JWT token from the request (query, input, cookie, or bearer token).
- **isRevoked()**: Checks if the token is revoked by querying the database.
- **verify()**: Uses JWT constraints to validate the token (signature, related user, expiration).
- **validate()**: Verifies the token and throws an exception if it is revoked or invalid.

This trait plays a crucial role in handling the common logic for retrieving and validating JWT tokens, used by both 
the `TokenGuard` and other middleware classes.

### Defining API Routes and Implementing Controllers

Once the `TokenGuard` is set up, we can define API routes that are protected by JWT authentication. The following 
routes will allow user registration, authentication, retrieving user details, token revocation, and token refresh.

In `routes/api.php`, we will define the following routes for user authentication and token management:

```php
<?php

use App\Http\Controllers\API\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('localization')->group(function () {
    Route::prefix('auth')->controller(AuthController::class)->name('auth.')->group(function () {
        Route::post('/authenticate', 'authenticate')->name('authenticate');
        Route::post('/register', 'register')->name('register');

        // Routes protected by access token
        Route::middleware(['jwt.access', 'auth:api'])->group(function () {
            Route::get('me', 'me')->name('me');           // Fetch authenticated user details
            Route::delete('revoke', 'revoke')->name('revoke'); // Revoke the user's token
        });

        // Route protected by refresh token
        Route::middleware(['jwt.refresh', 'auth:api'])->group(function () {
            Route::post('refresh', 'refresh')->name('refresh');  // Refresh access token
        });
    });
});

```

### Route Explanation

- **Localization Middleware**: The routes are prefixed with v1 and use the `localization` middleware to handle 
  language settings.
- **Authentication Endpoints**:
  - `/authenticate`: Allows users to authenticate with their credentials and receive an access token.
  - `/register`: Allows new users to register an account.
- **Protected Routes:**
  - **Access Token Protected Routes**: These routes require a valid access token (`jwt.access`) and authenticate the 
    user with the `auth:api` middleware.
    - `GET /me`: Fetch the authenticated user's details.
    - `DELETE /revoke`: Revoke the user's current token, effectively logging them out.
  - **Refresh Token Protected Routes**: This route requires a valid refresh token (`jwt.refresh`) and is also 
    authenticated with `auth:api`.
    - `POST /refresh`: Refresh the access token using the refresh token.

### Implementing Controllers

Nex, we will implement the `AuthController` to handle the logic behind these routes. The `AuthController
 will manage registration, authentication, token revocation, and token refreshing, ensuring secure interaction with 
JWT tokens.

Here is the full implementation of the `AuthController`:

```php
<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TokenResource;
use App\Http\Resources\UserResource;
use App\Models\JWT\Token;
use App\Models\User;
use App\Repositories\TokenRepository;
use App\Repositories\UserRepository;
use App\Traits\TokenValidation;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuthController extends Controller
{
    use TokenValidation;

    /**
     * Register a new user.
     *
     * @param  Request  $request
     * @param  UserRepository  $repository
     * @return JsonResponse
     */
    public function register(Request $request, UserRepository $repository): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'passwordConfirm' => 'required|same:password',
        ]);

        $user = $repository->create($validated);
        $response = $this->userResponse($user, Response::HTTP_CREATED);

        return $response;
    }

    /**
     * Authenticate a user and return a JWT token.
     *
     * @param  Request  $request
     * @param  TokenRepository  $repository
     * @return JsonResponse
     * @throws Throwable
     */
    public function authenticate(Request $request, TokenRepository $repository): JsonResponse
    {
        list($email, $password) = array_values($request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]));

        $user = User::where('email', $email)->first();

        throw_if(
            ! $user || ! Hash::check($password, $user->password),
            AuthenticationException::class,
            'Unauthenticated.'
        );

        $response = $this->userResponse($repository->create([$user]), Response::HTTP_OK);

        return $response;
    }

    /**
     * Revoke the current JWT token.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function revoke(Request $request): JsonResponse
    {
        $token = $this->getTokenForRequest($request);

        $this->service->revoke(Token::whereJsonContains('token->claims->grp', $token->claims()->get('grp'))->get());

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Refresh the JWT token.
     *
     * @param  TokenRepository  $repository
     * @return JsonResponse
     */
    public function refresh(TokenRepository $repository): JsonResponse
    {
        $user = auth('api')->user();

        $tokens = $repository->create([$user])->new_tokens;

        $response = new JsonResponse([
            'new_tokens' => TokenResource::collection($tokens)
        ], Response::HTTP_CREATED);

        return $response;
    }

    /**
     * Get the authenticated user's details.
     *
     * @return JsonResponse
     */
    public function me(): JsonResponse
    {
        $user = auth('api')->user();

        $response = $this->userResponse($user);

        return $response;
    }

    /**
     * Generate a user response with the given resource.
     *
     * @param  Authenticatable|null  $record
     * @param  int  $status
     * @return JsonResponse
     */
    private function userResponse(?Authenticatable $record, int $status = 200): JsonResponse
    {
        $resource = new UserResource($record);
        $response = new JsonResponse($resource, $status);

        return $response;
    }
}

```

### Resource Classes for Consistent Responses

To ensure consistency in the API responses, we will use Laravel's **Resource Classes**. These classes transform data 
into a JSON structure, allowing for easy formatting and customization of the response.

#### UserResource Class

The `UserResource` class formats the authenticated user's data:

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'new_tokens' => $this->whenHas('new_tokens', fn () => TokenResource::collection($this->new_tokens))
        ]);
    }
}

```

#### TokenResource Class

The `TokenResource` class formats the JWT token's headers and claims:

```php
<?php

namespace App\Http\Resources;

use App\Contracts\JWT\TokenServiceInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Lcobucci\JWT\UnencryptedToken;

class TokenResource extends JsonResource
{
    protected TokenServiceInterface $service;

    public function __construct($resource)
    {
        parent::__construct($resource);

        $this->service = app()->get(TokenServiceInterface::class);
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     * @throws Exception
     */
    public function toArray(Request $request): array
    {
        /** @var UnencryptedToken $token */
        $token = $this->token;

        return [
            'headers' => $token->headers()->all(),
            'claims' => $token->claims()->all(),
            'token' => $token->toString()
        ];
    }
}

```

#### Implementing Repositories

To handle database interactions, we will use repositories. Repositories provide a clean abstraction layer between 
our controllers and the database, making the code more maintenable and testable.

##### Abstract Repository

The `AbstractRepository` class provides the basic **CRUD** operations that can be reused across different models:

```php
<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Model;

abstract class AbstractRepository
{
    protected string $model;

    public function __construct()
    {
    }

    public function create(array $data): Model
    {
        return $this->model::create($data);
    }

    public function update(Model $model, array $data): bool
    {
        return $model->update($data);
    }

    public function destroy(Model $model): bool
    {
        return $model->delete();
    }
}

```

This abstract class defines three primary methods:

- **create**: To insert new records into the database.
- **update**: To update existing records.
- **destroy**: To delete a record from the database.

This can be extended by concrete repository classes to implement model-specific logic.

##### User Repository

The `UserRepository` is responsible for handling user-related database operations. It extends the `AbstractRepository
 and uses the `TokenServiceInterface` to generate tokens for newly created users.

```php
<?php

namespace App\Repositories;

use App\Contracts\JWT\TokenServiceInterface;
use App\Models\User;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Lcobucci\JWT\UnencryptedToken;

class UserRepository extends AbstractRepository
{
    protected string $model = User::class;

    public function __construct(
        protected TokenServiceInterface $service
    )
    {
        parent::__construct();
    }

    public function create(array $data): Authenticatable
    {
        $user = DB::transaction(function () use ($data) {
            /** @var User $user */
            $user = parent::create($data);

            $tokenPayloads = $this->service->data(sub: $user->id);

            /** @var Collection<UnencryptedToken> $tokens */
            $tokens = $tokenPayloads->map(fn ($payload) => $this->service->build($payload));

            /** @var Collection<array> $tokenData */
            $tokenData = $tokens->map(function(UnencryptedToken $token) use ($user) {
                return [
                    'id' => $token->claims()->get('jti'),
                    'token' => $token,
                    'tokenable_id' => $user->id,
                    'tokenable_type' => get_class($user),
                ];
            });

            $user->tokens()->createMany($tokenData);

            $user->setAttribute(
                'new_tokens',
                $tokenData->map(fn ($token) => new Token($token))
            );

            return $user;
        });

        return $user;
    }
}

```

**Explanation**:
- The `create` method creates a new user and generates JWT tokens for the user. It uses the `TokenServiceInterface` 
  to generate the tokens and saves them to the database.

##### Token Repository

The `TokenRepository` handles token-related operations, including generating and storing tokens for users.

```php
<?php

namespace App\Repositories;

use App\Contracts\JWT\TokenServiceInterface;
use App\Models\JWT\Token;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Lcobucci\JWT\UnencryptedToken;

class TokenRepository extends AbstractRepository
{
    protected string $model = Token::class;

    public function __construct(protected TokenServiceInterface $service)
    {
        parent::__construct();
    }

    public function create(array $data): Authenticatable
    {
        $user = DB::transaction(function () use ($data) {
            $user = current($data);

            $tokenPayloads = $this->service->data(sub: $user->id);

            /** @var Collection<UnencryptedToken> $tokens */
            $tokens = $tokenPayloads->map(fn ($payload) => $this->service->build($payload));

            /** @var Collection<array> $tokenData */
            $tokenData = $tokens->map(function(UnencryptedToken $token) use ($user) {
                return [
                    'id' => $token->claims()->get('jti'),
                    'token' => $token,
                    'tokenable_id' => $user->id,
                    'tokenable_type' => get_class($user),
                ];
            });

            $user->tokens()->createMany($tokenData);

            $user->setAttribute(
                'new_tokens',
                $tokenData->map(fn ($token) => new Token($token))
            );

            return $user;
        });

        return $user;
    }
}

```

**Explanation**:

- The `create` method in `TokenRepository` generates new JWT tokens for the authenticated user. Similar to the 
  `UserRepository`, it uses the `TokenServiceInterface` to generate tokens and stores them in the `jwt_tokens` table.

### Conclusion

In this section, we successfully configured the **API gate** to manage JWT-based authentication in Laravel. By 
implementing the `TokenGuard` class and utilizing the TokenValidation trait, we ensured that JWT tokens are properly 
extracted, validated, and authenticated before allowing access to protected routes. We defined key API routes for 
user registration, authentication, and token management, while ensuring that routes are protected using the 
appropriate JWT tokens — access tokens for immediate requests and refresh tokens for extending session lifetimes.

With the `AuthController` handling the core authentication logic, and Resource Classes ensuring consistent responses, 
this setup provides a robust and flexible foundation for secure token-based authentication. The middleware for 
handling both access and refresh tokens allows seamless management of token verification, adding an additional 
layer of security to your Laravel API.

This setup now enables a secure, well-structured authentication system based on JWT, ensuring that sensitive API 
endpoints are only accessible to authorized users with valid tokens.

## Middlewares

After setting up our database models, the next step is to implement middleware for handling the JWT tokens in 
incoming HTTP requests. We will create two middlewares:

1. **AccessTokenMiddleware**: To verify and process access tokens.
2. **RefreshTokenMiddleware**: To verify and process refresh tokens.

### Creating Middlewares:

We can use `artisan` to create these middlewares:

```shell
php artisan make:middleware JWT\AccessTokenMiddleware
php artisan make:middleware JWT\RefreshTokenMiddleware
```

### Middleware Structure

We will define a base abstract middleware class called `TokenAbstractMiddleware` that will handle the common logic 
for token validation. The [`TokenValidation`](#tokenvalidation-trait) trait, which was explained earlier, will be used to manage the 
core 
logic 
for extracting and validating tokens.

#### TokenAbstractMiddleware

The `TokenAbstractMiddleware` class provides the basic structure for handling token validation in Laravel:

```php
<?php

namespace App\Http\Middleware\JWT;

use App\Enums\JWT\TokenType;
use App\Models\JWT\Token;
use App\Traits\TokenValidation;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Psr\Container\ContainerExceptionInterface;
use Psr\Container\NotFoundExceptionInterface;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

abstract class TokenAbstractMiddleware
{
    use TokenValidation;

    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  Closure(Request): (Response)  $next
     * @return Response
     * @throws Throwable
     */
    abstract public function handle(Request $request, Closure $next): Response;

    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     * @throws Throwable
     */
    protected function start(Request $request, TokenType $type): void
    {
        $token = $this->getTokenForRequest($request);

        throw_if(
            ! $record = Token::where('id', $token?->claims()->get('jti'))->first(),
            AuthenticationException::class
        );

        throw_if(
            ! $record->tokenIs($type),
            AuthorizationException::class
        );

        $this->validate($token, $record);
    }
}

```

**Explanation**:

- **start()**: The method is responsible for extracting the JWT from the request, validating it, and ensuring it is 
  the correct type (either access or refresh token). If the token is not found or is invalid, exception are thrown, 
  which will be caught by the Laravel error-handling system.
- **TokenValidation**: This trait contains shared logic for token validation e.g, signature verification and claims 
  validation).

#### AccessTokenMiddleware

The `AccessTokenMiddleware` extends `TokenAbstractMiddleware` and verifies that the incoming request contains a 
valid access token.

```php
<?php

namespace App\Http\Middleware\JWT;

use App\Enums\JWT\TokenType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AccessTokenMiddleware extends TokenAbstractMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  Closure(Request): (Response)  $next
     * @return Response
     * @throws Throwable
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->start($request, TokenType::ACCESS);

        return $next($request);
    }
}

```

#### RefreshTokenMiddleware

Similarly, the `RefreshTokenMiddleware` verifies that the incoming request contains a valid refresh token.

```php
<?php

namespace App\Http\Middleware\JWT;

use App\Enums\JWT\TokenType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RefreshTokenMiddleware extends TokenAbstractMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  Closure(Request): (Response)  $next
     * @return Response
     * @throws Throwable
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->start($request, TokenType::REFRESH);

        return $next($request);
    }
}

```

#### LocalizationMiddleware

The `LocalizationMiddleware` is responsible for managing localization settings based on user preferences or request 
headers. This middleware sets the application's locale dynamically:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LocalizationMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $locale = $request->header('Accept-Language', config('app.locale'));
        app()->setLocale($locale);

        return $next($request);
    }
}

```

### Registering the Middleware

In Laravel 11, middleware registration is handled in the `bootstrap/app.php` file, allowing you to register 
middleware aliases and define middleware execution priorities in a more flexible manner.

To register middleware in Laravel 11, follow this structure in the `bootstrap/app.php` file:

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Registering middleware aliases
        $middleware->alias([
            'localization' => \App\Http\Middleware\LocalizationMiddleware::class,
            'jwt.access' => \App\Http\Middleware\JWT\AccessTokenMiddleware::class,
            'jwt.refresh' => \App\Http\Middleware\JWT\RefreshTokenMiddleware::class,
        ]);

        // Defining middleware priority
        $middleware->priority([
            \App\Http\Middleware\LocalizationMiddleware::class,
            \App\Http\Middleware\JWT\AccessTokenMiddleware::class,
            \App\Http\Middleware\JWT\RefreshTokenMiddleware::class,
            \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            \Illuminate\Auth\Middleware\Authorize::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Handle global exception configuration (if needed)
    })
    ->create();

```

This new approach cerntalizes middleware registration and management in the `bootstrap/app.php` file, streamlining 
the configuration and ensuring more control over middleware execution in your Laravel 11 application.

### Conclusion

With the middleware we have implemented, we now have a structure in place to protect our API endpoints using JWT 
tokens. The `AccessTokenMiddleware` and `RefreshTokenMiddleware`
 handle the validation of access and refresh tokens, while the `LocalizationMiddleware` sets the applications' 
language dynamically based on the users' preferences.

- **AccessTokenMiddleware**: This middleware ensures that only requests with valid access tokens are accepted. For 
  instance, routes like `me` that retrieve user data will only work with a valid access token.
- **RefreshTokenMiddleware**: Routes that rely on refresh tokens, like the route to renew an access token, are 
  protected by this middleware. It ensures that only valid refresh tokens are accepted.
- **LocalizationMiddleware**: It reads the `Accept-Language` header from the request and sets the application's 
  locale accordingly.
- 
With these middleware in place, you can now protect routes based on the type of token. For example, to secure a 
route that requires an access token:

```php
Route::middleware('jwt.access')->group(function() {
    Route::get('/me', [UserController::class, 'me']);
});

```

And for a route that requires a refresh token, such as refreshing an access token:

```php
Route::middleware('jwt.refresh')->group(function() {
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

```

This setup ensures that only users with valid JWT tokens can access the protected resources. Additionally, by 
incorporating the `LocalizationMiddleware`, your application can handle localization dynamically based on the users' 
preferences. Using middleware correctly is a fundamental component in building a secure and flexible API.

## Extra

In this section, we will introduce additional features, commands, and testing techniques to further enhance and 
verify the reliability of our JWT-based authentication system. This includes automatically generating RSA keys, 
cleaning up expired tokens using Laravel's command-line utilities, and implementing unit/feature tests to ensure 
everything is functioning as expected.

### Command Line Utilities

This clearly separates the content from testing, emphasizing the use of Laravel's command-line tools to enhance the 
JWT authentication system.

#### Creating Artisan Commands

Laravel's Artisan command-line tool allows you to quickly scaffold custom commands. To create a new command, use the 
`make:command` Artisan command:

```shell
php artisan make:command GenerateJwtKeys
php artisan make:command ClearExpiredTokens
```

This will create two new command files inside the `app/Console/Commands` directory. You can find the respective 
files as `GenerateJwtKeys` and `ClearExpiredTokens.php`. Laravel generates a basic structure, and we can now define 
the logic for these commands.

#### JWT Key Generation Command

To automate the process of generating RSA keys, we can create a console command that generates both the private and 
public keys, sets appropriate file permissions, and updates the `.env` file with the correct key paths.

Here's the source code for the `GenerateJwtKeys` command:

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;
use Illuminate\Support\Facades\File;

class GenerateJwtKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'jwt:generate-keys';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate JWT RSA keys, set permissions, and update .env file';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Ensure the storage/jwt directory exists
        $this->createJwtStorageDirectory();

        // Step 1: Generate the private key
        $this->generatePrivateKey();

        // Step 2: Generate the public key
        $this->generatePublicKey();

        // Step 3: Set group read permissions for the private key
        $this->setReadPermissions();

        // Step 4: Update the .env file with the real paths of the keys
        $this->updateEnvFile();

        return Command::SUCCESS;
    }

    /**
     * Ensure the storage/jwt directory exists.
     */
    private function createJwtStorageDirectory()
    {
        if (!File::exists(storage_path('jwt'))) {
            File::makeDirectory(storage_path('jwt'), 0755, true);
            $this->info('Created storage/jwt directory.');
        }
    }

    /**
     * Generate the RSA private key.
     */
    private function generatePrivateKey()
    {
        $process = new Process([
            'openssl',
            'genpkey',
            '-algorithm', 'RSA',
            '-out', storage_path('jwt/private_key.pem'),
            '-pkeyopt', 'rsa_keygen_bits:2048'
        ]);

        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $this->info('Private key generated successfully.');
    }

    /**
     * Generate the RSA public key.
     */
    private function generatePublicKey()
    {
        $process = new Process([
            'openssl',
            'rsa',
            '-pubout',
            '-in', storage_path('jwt/private_key.pem'),
            '-out', storage_path('jwt/public_key.pem')
        ]);

        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        $this->info('Public key generated successfully.');
    }

    /**
     * Set group read permissions for the private key.
     */
    private function setReadPermissions()
    {
        $privateKeyPath = storage_path('jwt/private_key.pem');

        // Set the file permissions to allow group read access
        chmod($privateKeyPath, 0644);

        $this->info('Group read permissions set for private key.');
    }

    /**
     * Update the .env file with the real paths of the private and public keys.
     */
    private function updateEnvFile()
    {
        $privateKeyPath = realpath(storage_path('jwt/private_key.pem'));
        $publicKeyPath = realpath(storage_path('jwt/public_key.pem'));

        $this->updateEnvVariable('JWT_PRIVATE_KEY', $privateKeyPath);
        $this->updateEnvVariable('JWT_PUBLIC_KEY', $publicKeyPath);

        $this->info('.env file updated with JWT key paths.');
    }

    /**
     * Update a specific environment variable in the .env file.
     *
     * @param string $key
     * @param string $value
     */
    private function updateEnvVariable(string $key, string $value)
    {
        $envFile = base_path('.env');
        $content = file_get_contents($envFile);

        if (strpos($content, "$key=") !== false) {
            // Update the existing key
            $content = preg_replace("/^$key=.*$/m", "$key=$value", $content);
        } else {
            // Add the key to the end of the file
            $content .= "\n$key=$value";
        }

        file_put_contents($envFile, $content);
    }
}

```

**Explanation**:

- This command automates the generation of RSA private and public keys.
- It sets appropriate file permissions for the keys and ensures the `.env` file contains the correct paths to the keys.
- This command can be executed by running:

```shell
php artisan jwt:generate-keys
```

#### Command to Clear Expired Tokens

To maintain a clean and efficient database, we should regularly remove expired tokens. For this, we will create a 
console command to delete expired JWT tokens based on their TTL (Time-to-live).

Here is the `ClearExpiredTOkens` command:

```php
<?php

namespace App\Console\Commands;

use App\Enums\JWT\TokenType;
use App\Models\JWT\Token;
use Illuminate\Console\Command;

class ClearExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-expired-tokens';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete expired tokens from the database';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $now = now();

        // Get the TTL for each token type from the configuration
        $tokenTypes = [
            TokenType::ACCESS->value => config('jwt.access.ttl'),
            TokenType::REFRESH->value => config('jwt.refresh.ttl'),
        ];

        // Prepare a query to delete expired tokens
        foreach ($tokenTypes as $type => $ttl) {
            $expiryDate = $now->subMinutes($ttl);

            // Delete expired tokens in bulk
            Token::where('type', $type)
                ->where('created_at', '<=', $expiryDate)
                ->delete();
        }
    }
}

```

**Explanation**:

- This command deleted all tokens that have expired based on their TTL configuration.
- You can schedule this command to run periodically using Laravel's task scheduling feature.
- To run this command manually, execute:

```shell
php artisan app:delete-expired-tokens
```

#### Scheduling the Token Cleanup Command

In Laravel 11, you no longer need to manage cron entries manually. Instead, you define your scheduled tasks inside 
the `routes/console.php` file. This. keeps your task schedules within source control and provides an expressive way 
to manage scheduling within your Laravel application.

##### Define Scheduled Tasks

To schedule the `ClearExpiredTokens` command, follow these steps:

1. Open the `routes/console.php` file.
2. Use the `Schedule` facade to define the schedule for your command.

Here's the code to schedule `CleareExpiredTokens` command to run daily:

```php
<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:delete-expired-tokens')->daily();

```

#### Additional Notes

In this approach:

- **Schedule::command** is used to schedule the `ClearExpiredTokens` Artisan command.
- The `daily()` method ensures that this task is run once a day.
- You can define other frequencies like `hourly()`, `evenryFiveMinutes()`, or even specific time intervals using 
  `cron()` expressions if needed.

#### Viewing Scheduled Tasks

To see an overview of your scheduled tasks and the next time they are scheduled to run, you can use the following 
Artisan command:

```shell
php artisan schedule:list
```

#### Conclusion

In Laravel 11, scheduling tasks is more flexible and can be handled directly within the application code. By adding 
your tasks to `routes/console.php`, you centralize task management and eliminate the need for manual cron job setup 
on you server. With the `CleareExpiredTokens` command scheduled to run daily, you ensure your database remains clean 
and efficient by automatically removing expired tokens.



### Testing

Ensuring the reliability and correct functionality of our project is crucial, which is why we need to create 
comprehensive test scenarios. In this section, we'll explain in detail how to write unit and functional tests for 
our JWT-based authentication system.

#### AuthTestHelpers (Test Helper Trait)

First, we create a trait called `AuthTestHelpers` to simplify our testing process and reduce repetitive code:

```php
<?php

namespace Tests\Assets\Traits;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\TestResponse;

trait AuthTestHelpers
{
    use RefreshDatabase, WithFaker;

    protected array $userResponseStructure;
    protected array $tokenResponseStructure;
    protected array $registeredUserResponseStructure;
    protected array $authenticatedUserResponseStructure;

    public function setUp(): void
    {
        parent::setUp();

        $this->tokenResponseStructure = [
            'headers' => [
                'typ',
                'alg'
            ],
            'claims' => [
                'jti',
                'grp',
                'typ',
                'iat',
                'exp',
                'nbf'
            ],
            'token'
        ];

        $this->userResponseStructure = [
            'id',
            'name',
            'email',
            'updated_at',
            'created_at'
        ];

        $this->registeredUserResponseStructure = array_merge($this->userResponseStructure, [
            'new_tokens' => [
                $this->tokenResponseStructure,
                $this->tokenResponseStructure
            ]
        ]);

        $this->authenticatedUserResponseStructure = $this->registeredUserResponseStructure;
    }

    /**
     * Create a new user and return the response.
     */
    protected function registerUser(array $overrides = []): TestResponse
    {
        $user = array_merge([
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => 'password',
            'passwordConfirm' => 'password'
        ], $overrides);

        if (isset($overrides['password'])) {
            $user['passwordConfirm'] = $overrides['password'];
        }

        return $this->post(route('auth.register'), $user, [
            'Accept' => 'application/json',
        ]);
    }

    /**
     * Get the authenticated user's information.
     */
    protected function me(?string $token = null, array $overrides = []): TestResponse
    {
        $user = $this->registerUser($overrides);

        $token = $token ?? $user->json('new_tokens.0.token');

        return $this->get(route('auth.me'), [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ]);
    }

    protected function authenticate(array $register = [], array $authenticate = []): TestResponse
    {
        $this->registerUser($register);

        return $this->post(route('auth.authenticate'), array_merge($register, $authenticate), [
            'Accept' => 'application/json',
        ]);
    }

    protected function revoke(?string $key = null): TestResponse
    {
        $registered = $this->registerUser();

        $token = $registered->json($key);

        return $this->delete(route('auth.revoke'), [], [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . $token,
        ]);
    }

    protected function refresh(?string $key = null): TestResponse
    {
        $registered = $this->registerUser();

        $token = $registered->json($key);

        return $this->post(route('auth.refresh'), [], [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . $token,
        ]);
    }
}

```

This trait provides helper methods for common operations such as user registration, authentication, token refresh, 
and revocation. It also defines expected JSON response structures. By using this trait, we can keep our test classes 
clean and focused on specific test scenarios.

**Key methods in this trait include**:

- `registerUser()`: Simulates user registration.
- `me()`: Retrieves authenticated user information.
- `authenticate()`: Simulates user login.
- `revoke()`: Simulates token revocation.
- `refresh()`: Simulates token refresh.

#### AuthControllerTest

The `AuthControllerTest` class checks various aspects of the authentication process:

```php
<?php

namespace Tests\Feature\Http\Controllers\API;

use App\Models\JWT\TokenBlacklist;
use Illuminate\Support\Facades\Config;
use Tests\Assets\Traits\AuthTestHelpers;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use AuthTestHelpers;

    /**
     * Test that user registration returns a 200 status.
     */
    public function test_user_registration_returns_status_201(): void
    {
        $response = $this->registerUser();
        $response->assertStatus(201);
    }

    /**
     * Test that user registration returns the correct JSON structure.
     */
    public function test_user_registration_returns_correct_json_structure(): void
    {
        $response = $this->registerUser();
        $response->assertJsonStructure($this->registeredUserResponseStructure);
    }

    /**
     * Test that the "me" endpoint returns a 200 status when accessed with a valid token.
     */
    public function test_me_endpoint_returns_status_200_with_valid_token(): void
    {
        $response = $this->me();
        $response->assertOk();
    }

    /**
     * Test that the "me" endpoint returns the correct user data structure.
     */
    public function test_me_endpoint_returns_correct_user_data_structure(): void
    {
        $this->me()->assertOk()->assertJsonStructure($this->userResponseStructure);
    }

    /**
     * Test that the "me" endpoint returns a 403 status when accessed with an invalid token type.
     */
    public function test_me_endpoint_returns_status_403_with_invalid_token_type(): void
    {
        $registered = $this->registerUser();
        $refreshToken = $registered->json('new_tokens.1.token');

        $this->me($refreshToken)->assertStatus(403)->assertJson([
            'message' => 'This action is unauthorized.'
        ]);
    }

    /**
     * Test that the "me" endpoint returns a 401 status when accessed with an invalid token.
     */
    public function test_me_endpoint_returns_status_401_with_invalid_token(): void
    {
        $this->me('invalid token')->assertStatus(401)->assertJson([
            'message' => 'Unauthenticated.'
        ]);
    }

    /**
     * Test that the "me" endpoint returns a 403 status when the token cannot be used yet.
     */
    public function test_me_endpoint_returns_status_403_when_token_cannot_be_used_yet(): void
    {
        Config::set('jwt.access.cbu', 30);

        $me = $this->me();

        $me->assertStatus(403)
            ->assertJson([
                'message' => 'The token cannot be used yet'
            ]);
    }

    /**
     * Test that the "me" endpoint returns a 403 status when the token is expired.
     */
    public function test_me_endpoint_returns_status_403_when_token_is_expired(): void
    {
        Config::set('jwt.access.ttl', -10);

        $me = $this->me();

        $me->assertStatus(403)
            ->assertJson([
                'message' => 'The token is expired'
            ]);
    }

    public function test_authenticate_endpoint_returns_status_200_when_provided_valid_credentials(): void
    {
        $auth = $this->authenticate([
            'email' => $this->faker->safeEmail,
            'password' => $this->faker->password,
        ]);

        $auth->assertStatus(200)
            ->assertJsonStructure($this->authenticatedUserResponseStructure);
    }

    public function test_authenticate_endpoint_returns_401_when_provided_invalid_credentials(): void
    {
        $auth = $this->authenticate(authenticate: [
            'email' => $this->faker->safeEmail,
            'password' => $this->faker->password,
        ]);

        $auth->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.'
            ]);
    }

    public function test_authenticate_endpoint_returns_422_when_provided_missing_credentials(): void
    {
        $auth = $this->authenticate(authenticate: [
            'email' => $this->faker->safeEmail,
        ]);

        $auth->assertStatus(422);
    }

    public function test_revoke_endpoint_returns_status_204(): void
    {
        $revoke = $this->revoke('new_tokens.0.token');

        $revoke->assertStatus(204);
    }

    public function test_revoke_endpoint_returns_401_when_provided_invalid_token(): void
    {
        $revoke = $this->revoke('invalid token');

        $revoke->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.'
            ]);
    }

    public function test_revoke_endpoint_returns_403_with_invalid_token_type(): void
    {
        $revoke = $this->revoke('new_tokens.1.token');

        $revoke->assertStatus(403)
            ->assertJson([
                'message' => 'This action is unauthorized.'
            ]);
    }

    public function test_revoke_endpoint_returns_correct_errors_when_provided_revoked_tokens_by_different_situations(): void
    {
        $registered = $this->registerUser();

        $revokeRequest = fn (string $token) => $this->delete(route('auth.revoke'), [], [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ]);

        $revokedTokens = [
            'access_token' => $registered->json('new_tokens.0.token'),
            'refresh_token' => $registered->json('new_tokens.1.token'),
        ];

        $access = current($revokedTokens);
        $refresh = next($revokedTokens);

        $revokeRequest($refresh)->assertStatus(403)->assertJson([
            'message' => 'This action is unauthorized.'
        ]);

        $revokeRequest($access)->assertNoContent()->isEmpty();

        foreach($revokedTokens as $revokedToken) {
            $revokeRequest($revokedToken)->assertStatus(403)->assertJson([
                'message' => ($revokedToken === $refresh) ? 'This action is unauthorized.' : 'The token is revoked'
            ]);
        }
    }

    public function test_revoke_endpoint_inserts_tokens_to_blacklist(): void
    {
        $registered = $this->registerUser();

        $revoke = $this->delete(route('auth.revoke'), [], [
            'Authorization' => 'Bearer ' . $registered->json('new_tokens.0.token'),
            'Accept' => 'application/json',
        ]);

        $revoke->assertNoContent();

        collect($registered->json('new_tokens'))->each(function (array $token) {
            $this->assertDatabaseHas((new TokenBlacklist())->getTable(), [
                'jwt_token_id' => $token['claims']['jti'],
            ]);
        });
    }

    public function test_refresh_endpoint_returns_201_with_valid_token_type(): void
    {
        $this->refresh('new_tokens.1.token')->assertCreated()->assertJsonStructure([
            'new_tokens' => [
                $this->tokenResponseStructure,
                $this->tokenResponseStructure,
            ]
        ]);
    }

    public function test_refresh_endpoint_returns_403_with_invalid_token_type(): void
    {
        $this->refresh('new_tokens.0.token')->assertStatus(403)->assertJson([
            'message' => 'This action is unauthorized.'
        ]);
    }

    public function test_refresh_endpoint_returns_401_when_provided_invalid_token(): void
    {
        $this->refresh('invalid token')->assertUnauthorized()->assertJson([
            'message' => 'Unauthenticated.'
        ]);
    }

    public function test_refresh_endpoint_returns_valid_tokens_when_provided_valid_token(): void
    {
        $refreshRequest = fn (string $token) => $this->post(route('auth.refresh'), [], [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ]);

        $validJsonStructure = [
            'new_tokens' => [
                $this->tokenResponseStructure,
                $this->tokenResponseStructure,
            ]
        ];

        $registered = $this->registerUser();

        $refreshToken = $registered->json('new_tokens.1.token');
        $firstRefreshRequest = $refreshRequest($refreshToken);
        $firstRefreshRequest->assertCreated()->assertJsonStructure($validJsonStructure);

        $newRefreshToken = $firstRefreshRequest->json('new_tokens.1.token');
        $secondRefreshRequest = $refreshRequest($newRefreshToken);
        $secondRefreshRequest->assertCreated()->assertJsonStructure($validJsonStructure);
    }
}

```

This test class covers the following scenarios:

1. **User Registration**
    - Validates successful registration (201 status)
    - Ensures correct response structure

2. **"Me" Endpoint**
    - Checks successful retrieval of user data (200 status)
    - Verifies correct data structure
    - Tests various token scenarios:
        * Invalid token type (403 status)
        * Invalid token (401 status)
        * Token not yet usable (403 status)
        * Expired token (403 status)

3. **Authentication**
    - Tests with:
        * Valid credentials (200 status)
        * Invalid credentials (401 status)
        * Missing credentials (422 status)

4. **Token Revocation**
    - Verifies successful revocation (204 status)
    - Checks behavior with:
        * Invalid token (401 status)
        * Invalid token type (403 status)
    - Tests various revocation scenarios

5. **Token Refresh**
    - Ensures successful refresh (201 status)
    - Validates behavior with:
        * Invalid token type (403 status)
        * Invalid token (401 status)
    - Confirms return of valid tokens upon successful refresh

Each test method checks different situations, for example:

```php
    // ...
    
    public function test_me_endpoint_returns_status_200_with_valid_token(): void
    {
        $response = $this->me();
        $response->assertOk();
    }
    
    public function test_me_endpoint_returns_status_403_when_token_is_expired(): void
    {
        Config::set('jwt.access.ttl', -10);
    
        $me = $this->me();
    
        $me->assertStatus(403)
            ->assertJson([
                'message' => 'The token is expired'
            ]);
    }
    
    // ...
```

#### UserRepositoryTest

The `UserRepositoryTest` class verifies that the `create` method of `UserRepository
 works correctly:

```php
<?php

namespace Tests\Feature\Repositories;

use App\Models\JWT\Token;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Collection;
use Tests\TestCase;

class UserRepositoryTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_create_method_creating_users_correctly(): void
    {
        $repository = app()->make(UserRepository::class);

        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->safeEmail,
            'password' => $this->faker->password,
        ];

        $user = $repository->create($userData);

        $userID = $user->id;

        $this->assertDatabaseHas((new User())->getTable(), [
            'id' => $userID,
        ]);

        /** @var Collection $tokens */
        $tokens = $user->getAttribute('new_tokens');

        $tokens->map(function (Token $record) use ($userID) {
            $this->assertEquals($userID, $record->token->claims()->get('sub'));
        });
    }
}

```

This test ensures that a user is created correctly and appropriate tokens are assigned to them. It checks if the 
user data is properly stored in the database and if the generated tokens have the correct claims.

#### TokenValidationTest

The `TokenValidationTest` class checks various aspects of the token validation process:

```php
<?php

namespace Tests\Feature\Traits;
use Illuminate\Support\Facades\Config;
use Mockery;
use Tests\Assets\Traits\AuthTestHelpers;
use Tests\TestCase;

class TokenValidationTest extends TestCase
{
    use AuthTestHelpers;

    protected function tearDown(): void
    {
        parent::tearDown();
        Mockery::close();
    }

    public function test_validate_method_revokes_the_token_when_provided_invalid_token(): void
    {
        Config::set('jwt.access.ttl', -10);

        $registered = $this->registerUser();
        $token = $registered->json('new_tokens.0');

        $me = $this->me($token['token']);

        $me->assertStatus(403)
            ->assertJson([
                'message' => 'The token is expired'
            ]);

        $this->assertDatabaseHas('jwt_token_blacklist', [
            'jwt_token_id' => $token['claims']['jti'],
        ]);
    }

    public function test_validate_method_returns_correct_error_when_provided_revoked_token(): void
    {
        Config::set('jwt.access.ttl', -10);

        $registered = $this->registerUser();
        $token = $registered->json('new_tokens.0');

        $this->me($token['token'])->assertStatus(403)->assertJson([
            'message' => 'The token is expired'
        ]);

        $this->assertDatabaseHas('jwt_token_blacklist', [
            'jwt_token_id' => $token['claims']['jti'],
        ]);

        $this->me($token['token'])->assertStatus(403)->assertJson([
            'message' => 'The token is revoked'
        ]);
    }
}

```

These tests verify that expired or revoked tokens are handled correctly. They simulate scenarios where tokens are 
expired or revoked and ensure that the system responds appropriately.

#### TokenServiceTest

The `TokenServiceTest` class verifies that the build method of `TokenService` works correctly:

```php
<?php

namespace Tests\Unit\Services;

use App\Services\TokenService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Lcobucci\JWT\UnencryptedToken;
use Tests\TestCase;

class TokenServiceTest extends TestCase
{
    public function test_build_method_can_builds_tokens(): void
    {
        $service = new TokenService();

        $payloads = $service->data(Str::uuid()->toString());

        $tokens = $payloads->map(function (Collection $payload) use ($service) {
            return $service->build($payload);
        });

        $this->assertInstanceOf(Collection::class, $tokens);

        $tokens->each(function ($token) use ($service) {
            $this->assertInstanceOf(UnencryptedToken::class, $token);
        });
    }
}

```

This test confirms that `TokenService` can create JWT tokens. It generates payloads, builds tokens and then asserts 
that the resulting tokens are of the correct type.

#### Running the Tests

To run all tests, enter the following command in the terminal:

```shell
php artisan test
```

To run a specific test class or method:

```shell
php artisan test --filter=AuthControllerTest
php artisan test --filter=AuthControllerTest::test_user_registration_returns_status_201
```

It's a good practice to run these tests:

- After making any changes to the authentication system
- Before deploying to production
- As part of your continuous integration pipeline

This comprehensive test suite ensures that all aspects of our JWT-based authentication system are working as 
expected. By running these tests regularly, you can catch potential issues early in the development process and 
maintain the reliability of your authentication system.

#### Conclusion

In this testing section, we've built a comprehensive suite of tests to ensure the robustness and security of our 
JWT-based authentication system. These tests cover various scenarios such as user registration, authentication, 
token validation, and revocation. By leveraging PHPUnit and Laravel's testing capabilities, we've simulated 
different cases to verify that our API behaves as expected under normal, edge, and invalid conditions.

Running these tests regularly helps ensure that new changes or features do not introduce bugs or break existing 
functionality. By maintaining a strong test suite, you'll improve the reliability, security, and maintainability 
of your authentication system, ultimately delivering a better product to your users. Always keep your tests up to 
date as your application evolves.

> Remember to update your tests whenever you add new features or modify existing functionality in your 
> authentication  system. This will help maintain in the integrity of your codebase and ensure that new changes 
> don't break existing  functionality. 
{: .prompt-warning}

## Final Thoughts

In this guide, we’ve walked through implementing secure JWT-based authentication in a Laravel 11 application using 
the `lcobucci/jwt` package. By leveraging asymmetric encryption with RSA keys, we’ve ensured robust security for 
token issuance and validation. From generating keys and configuring middleware to handling token management with 
services and testing our implementation, this comprehensive approach provides a solid foundation for any Laravel 
project requiring authentication.

Remember, JWT-based authentication is powerful but requires careful implementation, especially around token 
security, expiration, and revocation. Regularly update your security practices and maintain a strong test suite to 
ensure that your authentication system remains reliable and secure.

Feel free to adapt and expand upon the examples presented here to fit your project’s needs, and always stay up to 
date with best practices for secure application development.

<iframe 
    src="https://github.com/sponsors/shahmal1yev/button" 
    title="Sponsor shahmal1yev" 
    height="32" 
    width="100%"
    style="border: 0; border-radius: 6px;margin: 0 auto;"></iframe>