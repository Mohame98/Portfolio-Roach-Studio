<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('email', 160);
            $table->string('company', 120)->nullable();
            $table->text('message');
            $table->string('budget', 32);
            $table->string('timeline', 32);
            $table->string('locale', 16)->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('cf_ray', 64)->nullable();
            $table->string('cf_country', 8)->nullable();
            $table->boolean('mail_sent')->default(false);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'created_at']);
            $table->index('ip_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_submissions');
    }
};
