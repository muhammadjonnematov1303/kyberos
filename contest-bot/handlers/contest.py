import asyncio
import random
import re
from aiogram import Router, Bot, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, Dice
from aiogram.exceptions import TelegramBadRequest
from config import config
from db.database import get_participants, add_participant, participant_count, clear_participants, save_contest

router = Router()

DICE_EMOJI = "🎲"
WINNER_TEXTS = [
    "Tabriklaymiz! 🎉",
    "G'olib aniqlandi! 🏆",
    "Omad sizga kulib boqdi! ✨",
]

def is_admin(user_id: int) -> bool:
    return user_id in config.ADMIN_IDS

def make_result_keyboard(channel_username: str, channel_name: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🔵 Kanalga o'tish",
                url=f"https://t.me/{channel_username.lstrip('@')}"
            )
        ],
        [
            InlineKeyboardButton(
                text="🟢 Qatnashish",
                callback_data="join_contest"
            ),
            InlineKeyboardButton(
                text="🔴 Natijalar",
                callback_data="show_results"
            )
        ],
    ])

def make_start_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🟢 Qatnashish", callback_data="join_contest"),
            InlineKeyboardButton(text="📊 Statistika", callback_data="stats")
        ],
        [
            InlineKeyboardButton(text="🔵 Kanal", url="https://t.me/"),
            InlineKeyboardButton(text="📞 Aloqa", url="https://t.me/")
        ],
    ])

@router.message(F.text == "/start")
async def cmd_start(message: Message):
    user = message.from_user
    add_participant(user.id, user.username, user.first_name)

    text = (
        f"👋 Assalomu alaykum, <b>{user.first_name}</b>!\n\n"
        f"🎁 <b>Kontest bot</b>ga xush kelibsiz!\n\n"
        f"Bu bot orqali siz turli tanlovlarda ishtirok etishingiz va "
        f"qimmatli sovrinlarni qo'lga kiritishingiz mumkin.\n\n"
        f"🟢 <b>Qatnashish</b> tugmasini bosib tanlovda ishtirok eting\n"
        f"📊 <b>Statistika</b> — joriy holatni ko'ring\n"
        f"🔵 <b>Kanal</b> — rasmiy kanalimizga o'ting\n\n"
        f"🏆 Omad tilaymiz!"
    )

    await message.answer(text, reply_markup=make_start_keyboard(), parse_mode="HTML")

@router.message(F.text == "/link")
async def cmd_link(message: Message):
    if not is_admin(message.from_user.id):
        await message.answer("❌ Ushbu buyruq faqat adminlar uchun")
        return

    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        await message.answer(
            "📝 <b>Foydalanish:</b>\n\n"
            "<code>/link @kanal_ nomi</code>\n\n"
            "Misol: <code>/link @mychannel</code>",
            parse_mode="HTML"
        )
        return

    channel_input = args[1].strip().lstrip("@")

    # Announce messages
    announce_text = (
        f"{DICE_EMOJI} <b>G'olib aniqlanmoqda...</b>\n\n"
        f"⏳ Bir oz kuting, omad sizga kulib boqsin!"
    )

    # Send to admin chat
    admin_msg = await message.answer(announce_text, parse_mode="HTML")

    # Try to send to channel
    channel_msg = None
    try:
        channel_msg = await message.bot.send_message(
            chat_id=f"@{channel_input}",
            text=announce_text,
            parse_mode="HTML"
        )
    except Exception as e:
        await admin_msg.edit_text(f"❌ Kanalga yuborishda xatolik:\n<code>{e}</code>", parse_mode="HTML")
        return

    # Send dice animation
    try:
        await message.bot.send_dice(chat_id=admin_msg.chat.id, emoji=DICE_EMOJI)
        if channel_msg:
            await message.bot.send_dice(chat_id=channel_msg.chat.id, emoji=DICE_EMOJI)
    except Exception:
        pass

    # Wait 5 seconds
    await asyncio.sleep(5)

    # Get participants
    participants = get_participants()
    count = len(participants)

    if count == 0:
        cancel_text = "😔 Afsuski, hech kim qatnashmadi.\n\nTanlov bekor qilindi."
        await admin_msg.edit_text(cancel_text)
        try:
            await message.bot.edit_message_text(
                chat_id=channel_msg.chat.id,
                message_id=channel_msg.message_id,
                text=cancel_text
            )
        except Exception:
            pass
        return

    # Select winner
    winner = random.choice(participants)
    winner_id = winner["user_id"]
    winner_username = winner["username"] or f"ID: {winner_id}"
    winner_name = winner["first_name"] or "Foydalanuvchi"

    # Build result message
    winner_tag = f"@{winner_username}" if winner["username"] else f"ID: <code>{winner_id}</code>"

    result_text = (
        f"🎉 <b>{random.choice(WINNER_TEXTS)}</b>\n\n"
        f"🏆 <b>G'olib:</b> {winner_name}\n"
        f"👤 <b>Username:</b> {winner_tag}\n\n"
        f"👥 <b>Ishtirokchilar:</b> {count} nafar\n"
        f"🎲 <b>Tanlov:</b> @ {channel_input}\n\n"
        f"✨ Tabriklaymiz! G'olib bilan bog'lanamiz."
    )

    # Edit admin message
    try:
        await admin_msg.edit_text(result_text, parse_mode="HTML")
    except TelegramBadRequest:
        await message.answer(result_text, parse_mode="HTML")

    # Send to channel
    try:
        keyboard = make_result_keyboard(channel_input, channel_input)
        await message.bot.edit_message_text(
            chat_id=channel_msg.chat.id,
            message_id=channel_msg.message_id,
            text=result_text,
            parse_mode="HTML",
            reply_markup=keyboard
        )
    except TelegramBadRequest:
        try:
            await message.bot.send_message(
                chat_id=channel_msg.chat.id,
                text=result_text,
                parse_mode="HTML",
                reply_markup=keyboard
            )
        except Exception:
            pass

    # Save to database
    save_contest(channel_input, None, winner_id, winner_username, winner_name, channel_msg.message_id if channel_msg else None)

@router.callback_query(F.data == "join_contest")
async def cb_join(callback: object):
    from aiogram.types import CallbackQuery
    cb: CallbackQuery = callback
    user = cb.from_user
    added = add_participant(user.id, user.username, user.first_name)

    if added:
        text = (
            f"✅ <b>{user.first_name}</b>, siz muvaffaqiyatli qo'shildingiz!\n\n"
            f"🎉 Omad sizga kulib boqsin!"
        )
        await cb.answer("✅ Qo'shildingiz!", show_alert=False)
    else:
        text = (
            f"ℹ️ Siz allaqachon ro'yxatdan o'tgansiz!\n\n"
            f"📊 Statistika: {participant_count()} ishtirokchi"
        )
        await cb.answer("ℹ️ Siz allaqachon qo'shilgansiz", show_alert=False)

    try:
        await cb.message.edit_text(text, parse_mode="HTML", reply_markup=make_start_keyboard())
    except Exception:
        pass

@router.callback_query(F.data == "stats")
async def cb_stats(callback: object):
    from aiogram.types import CallbackQuery
    cb: CallbackQuery = callback
    count = participant_count()

    text = (
        f"📊 <b>Statistika</b>\n\n"
        f"👥 Jami ishtirokchilar: <b>{count}</b> nafar\n"
        f"🎯 Tanlov holati: <b>Faol</b>\n\n"
        f"🟢 Qatnashish tugmasini bosib tanlovda ishtirok eting!"
    )

    await cb.answer()
    try:
        await cb.message.edit_text(text, parse_mode="HTML", reply_markup=make_start_keyboard())
    except Exception:
        pass

@router.callback_query(F.data == "show_results")
async def cb_results(callback: object):
    from aiogram.types import CallbackQuery
    cb: CallbackQuery = callback
    count = participant_count()

    text = (
        f"📊 <b>Natijalar</b>\n\n"
        f"👥 Jami ishtirokchilar: <b>{count}</b> nafar\n\n"
        f"🏆 G'olib yaqinda e'lon qilinadi!"
    )

    await cb.answer()
    try:
        await cb.message.edit_text(text, parse_mode="HTML")
    except Exception:
        pass
