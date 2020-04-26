package dk.iwt.agile.boundary;

import java.io.StringReader;
import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.enterprise.context.ApplicationScoped;
import javax.json.Json;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonString;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import org.jboss.logging.Logger;

@ServerEndpoint(value = "/poker-socket/{username}/{isPlayer}", encoders = {JsonEncoder.class})
@ApplicationScoped
public class PokerWebSocket {

    private static final Logger LOG = Logger.getLogger(PokerWebSocket.class);

    Map<String, Session> sessions = new ConcurrentHashMap<>();
    Map<String, String> scores = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("username") String username, @PathParam("isPlayer") Boolean isPlayer) {
        sessions.put(username, session);
        if (isPlayer) {
            scores.put(username, "");
        }
        broadcast(false);
    }

    @OnClose
    public void onClose(Session session, @PathParam("username") String username) {
        sessions.remove(username);
        scores.remove(username);
        broadcast(false);
    }

    @OnError
    public void onError(Session session, @PathParam("username") String username, Throwable throwable) {
        sessions.remove(username);
        LOG.error("onError", throwable);
        broadcast(false);
    }

    @OnMessage
    public void onMessage(String message, @PathParam("username") String username) {
        if (message.contains("score")) {
            JsonReader reader = Json.createReader(new StringReader(message));
            JsonObject object = (JsonObject) reader.read();
            JsonString score = (JsonString) object.get("score");
            scores.put(username, score.getString());
            broadcast(false);
        } else if (message.contains("showResults")) {
            broadcast(true);
        } else if (message.contains("reset")) {
            scores.clear();
            broadcast(false);
        }
    }

    private void broadcast(boolean showResults) {
        sessions.values().forEach(s -> {
            s.getAsyncRemote().sendObject(parseMessage(showResults), result -> {
                if (result.getException() != null) {
                    System.out.println("Unable to send message: " + result.getException());
                }
            });
        });
    }

    private JsonObject parseMessage(boolean showResults) {
        JsonObjectBuilder outputBuilder = Json.createObjectBuilder();

        if (showResults) {
            outputBuilder.add("showResults", showResults);
        } else {
            JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
            scores.forEach((user, score) -> {
                arrayBuilder.add(Json.createObjectBuilder().add("name", user).add("score", score));
            });

            outputBuilder.add("scores", arrayBuilder);
            outputBuilder.add("allVotesAreIn", hasEveryoneVoted());
        }

        return outputBuilder.build();
    }

    private boolean hasEveryoneVoted() {
        int hasScored = 0;
        hasScored = scores.values().stream()
                .filter((score) -> (score.length() > 0))
                .map((_item) -> 1)
                .reduce(hasScored, Integer::sum);
        return hasScored == scores.size();
    }
}
